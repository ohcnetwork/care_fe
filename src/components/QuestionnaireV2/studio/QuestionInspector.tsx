import { MoreVertical, Trash2 } from "lucide-react";
import { Dispatch, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { AnswerOptionsEditor } from "@/components/QuestionnaireV2/builder/AnswerOptionsEditor";
import {
  BehaviourSettingsCard,
  NON_REPEATABLE_TYPES,
} from "@/components/QuestionnaireV2/builder/BehaviourSettingsCard";
import { BuilderAction } from "@/components/QuestionnaireV2/builder/builderReducer";
import { QuestionCodingCard } from "@/components/QuestionnaireV2/builder/QuestionCodingCard";
import { QuestionTypePicker } from "@/components/QuestionnaireV2/builder/QuestionTypePicker";
import { SubQuestionsList } from "@/components/QuestionnaireV2/builder/SubQuestionsList";
import { VisibilityConditionsCard } from "@/components/QuestionnaireV2/builder/VisibilityConditionsCard";
import { QuestionTypeBadge } from "@/components/QuestionnaireV2/shared/QuestionTypeBadge";

import { Question } from "@/types/questionnaire/question";

import { plainWordsSummary } from "./conditionSummary";

/** Types with a question-level unit, per the legacy editor's UNIT_TYPES —
 *  quantity configures its unit inside AnswerOptionsEditor; these get the
 *  plain unit row (shown as a `({code})` label suffix in the renderer). */
const UNIT_ROW_TYPES: Question["type"][] = ["integer", "decimal", "choice"];

const TAB_TRIGGER_CLASSES =
  "rounded-none border-b-3 border-transparent bg-transparent px-2.5 py-2 text-sm font-semibold text-gray-600 shadow-none data-[state=active]:border-b-primary-700 data-[state=active]:bg-transparent data-[state=active]:text-primary-800 data-[state=active]:shadow-none";

interface QuestionInspectorProps {
  question: Question;
  number: string;
  allQuestions: Question[];
  dispatch: Dispatch<BuilderAction>;
}

/**
 * The studio's question inspector, organized per the reference design:
 * identity header (ordinal, title, type badge, kebab) over three tabs —
 * Question (type, text, options, behaviour, group tooling), Logic
 * (visibility rules with the plain-words summary) and Coding (observation
 * code plus the data-capture "also capture" flags). Composes the same
 * editor internals as the previous single-card editor.
 */
export function QuestionInspector({
  question,
  number,
  allQuestions,
  dispatch,
}: QuestionInspectorProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("question");
  const ruleCount = question.enable_when?.length ?? 0;

  const onChange = (patch: Partial<Question>) => {
    dispatch({ type: "updateQuestion", id: question.id, patch });
  };

  const handleTypeChange = (patch: Partial<Question>) => {
    const changingAwayFromGroup =
      question.type === "group" && patch.type && patch.type !== "group";
    if (changingAwayFromGroup && (question.questions?.length ?? 0) > 0) {
      toast.error(t("group_type_change_blocked"));
      return;
    }
    // Mirrors the legacy editor's type-change handling: switching to a type
    // that never offers Repeats also clears a previously-set flag, so it
    // can't linger invisibly once the chip disappears.
    const nextType = patch.type ?? question.type;
    if (question.repeats && NON_REPEATABLE_TYPES.includes(nextType)) {
      patch = { ...patch, repeats: false };
    }
    onChange(patch);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 px-4 pt-4">
          <span className="shrink-0 font-mono text-xs text-gray-400 tabular-nums">
            {number}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            {question.text || (
              <span className="italic font-normal text-gray-400">
                {t("untitled_question")}
              </span>
            )}
          </span>
          <QuestionTypeBadge type={question.type} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={t("more_options")}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  dispatch({ type: "removeQuestions", ids: [question.id] })
                }
              >
                <Trash2 className="size-4" />
                {t("delete_question")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-gray-200 bg-transparent p-0 px-4">
            <TabsTrigger value="question" className={TAB_TRIGGER_CLASSES}>
              {t("question")}
            </TabsTrigger>
            <TabsTrigger value="logic" className={TAB_TRIGGER_CLASSES}>
              {t("logic")}
              {ruleCount > 0 && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                  {ruleCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="coding" className={TAB_TRIGGER_CLASSES}>
              {t("coding")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="question" className="space-y-4 p-4">
            <div className="w-full">
              <QuestionTypePicker
                value={question.type}
                structuredType={question.structured_type}
                onChange={handleTypeChange}
              />
            </div>

            {/* The label stays for a11y/tests ("Question Title" textbox)
                but is visually hidden; the underline appears on focus. */}
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 text-sm font-medium text-gray-400">
                {number}
              </span>
              <div className="min-w-0 flex-1">
                <Label
                  htmlFor={`question-title-${question.id}`}
                  className="sr-only"
                >
                  {t("question_title")}
                </Label>
                <Input
                  id={`question-title-${question.id}`}
                  value={question.text}
                  placeholder={t("enter_question_title")}
                  onChange={(e) => onChange({ text: e.target.value })}
                  className="h-auto rounded-none border-0 border-b border-transparent px-0 py-1.5 text-lg font-medium shadow-none focus:border-gray-900 focus:ring-0 focus-visible:border-gray-900 hover:border-gray-200 placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("description")}</Label>
              <Input
                value={question.description ?? ""}
                placeholder={t("type_description")}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </div>

            {(question.type === "choice" || question.type === "quantity") && (
              <AnswerOptionsEditor question={question} onChange={onChange} />
            )}

            {UNIT_ROW_TYPES.includes(question.type) && (
              <div className="space-y-1.5">
                <Label>{t("unit")}</Label>
                <p className="text-sm text-gray-500">{t("unit_hint")}</p>
                <ValueSetSelect
                  system="system-ucum-units"
                  value={question.unit}
                  onSelect={(code) => onChange({ unit: code })}
                  aria-label={t("unit")}
                  placeholder={t("add_unit")}
                />
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">
                {t("behaviour")}
              </p>
              <BehaviourSettingsCard
                question={question}
                onChange={onChange}
                bare
                sections={["behaviour"]}
              />
            </div>

            {question.type === "group" && (
              <SubQuestionsList
                question={question}
                dispatch={dispatch}
                allQuestions={allQuestions}
              />
            )}
          </TabsContent>

          <TabsContent value="logic" className="space-y-4 p-4">
            <p className="text-sm text-gray-500">{t("logic_tab_intro")}</p>
            <VisibilityConditionsCard
              question={question}
              allQuestions={allQuestions}
              onChange={onChange}
              bare
            />
            <div className="rounded-lg bg-emerald-50 p-3.5">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                {t("in_plain_words")}
              </p>
              <p className="text-sm leading-relaxed text-gray-800">
                {plainWordsSummary(question, allQuestions, t)}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="coding" className="space-y-4 p-4">
            <p className="text-sm text-gray-500">{t("coding_tab_intro")}</p>
            <QuestionCodingCard question={question} onChange={onChange} bare />
            <div className="border-t border-gray-100 pt-4">
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-500">
                  {t("also_capture")}
                </p>
                <p className="text-xs text-gray-400">
                  {t("also_capture_hint")}
                </p>
              </div>
              <BehaviourSettingsCard
                question={question}
                onChange={onChange}
                bare
                sections={["data_capture"]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
