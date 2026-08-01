import { MoreVertical, Trash2 } from "lucide-react";
import { Dispatch } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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

import { Question } from "@/types/questionnaire/question";

/** Types with a question-level unit, per the legacy editor's UNIT_TYPES
 *  (quantity/choice/decimal/integer). Quantity configures its unit inside
 *  the AnswerOptionsEditor (default among the unit choices); the rest get
 *  the plain unit row below — the unit shows next to the question label in
 *  fill mode (`({code})`, legacy QuestionLabel behavior). */
const UNIT_ROW_TYPES: Question["type"][] = ["integer", "decimal", "choice"];

interface QuestionEditorCardProps {
  question: Question;
  number: string;
  allQuestions: Question[];
  dispatch: Dispatch<BuilderAction>;
}

export function QuestionEditorCard({
  question,
  number,
  allQuestions,
  dispatch,
}: QuestionEditorCardProps) {
  const { t } = useTranslation();

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
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
          {/* Column stack: ordinal + title on line 1, the type badge on line
              2 — so long titles truncate instead of wrapping the kebab. */}
          <div className="flex min-w-0 items-start gap-2">
            <span className="text-sm text-gray-500">{number}</span>
            <div className="flex min-w-0 flex-col items-start gap-1">
              <span className="max-w-full truncate text-sm font-semibold text-gray-900">
                {question.text || (
                  <span className="italic text-gray-400">
                    {t("untitled_question")}
                  </span>
                )}
              </span>
              <Badge variant="secondary">
                {t("question_type")}: {t(`question_type__${question.type}`)}
              </Badge>
            </div>
          </div>
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

        <div className="space-y-1.5">
          <Label htmlFor={`question-title-${question.id}`}>
            {t("question_title")}
          </Label>
          <Input
            id={`question-title-${question.id}`}
            value={question.text}
            placeholder={t("enter_question_title")}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("question_type")}</Label>
          <QuestionTypePicker
            value={question.type}
            structuredType={question.structured_type}
            onChange={handleTypeChange}
          />
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

        <QuestionCodingCard question={question} onChange={onChange} />

        <BehaviourSettingsCard question={question} onChange={onChange} />

        <VisibilityConditionsCard
          question={question}
          allQuestions={allQuestions}
          onChange={onChange}
        />

        {question.type === "group" && (
          <SubQuestionsList
            question={question}
            dispatch={dispatch}
            allQuestions={allQuestions}
          />
        )}
      </CardContent>
    </Card>
  );
}
