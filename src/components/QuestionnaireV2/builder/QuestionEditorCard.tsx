import { Check, MoreVertical, Trash2 } from "lucide-react";
import { Dispatch } from "react";
import { useForm } from "react-hook-form";
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

import { AnswerOptionsEditor } from "@/components/QuestionnaireV2/builder/AnswerOptionsEditor";
import { BehaviourSettingsCard } from "@/components/QuestionnaireV2/builder/BehaviourSettingsCard";
import { BuilderAction } from "@/components/QuestionnaireV2/builder/builderReducer";
import { QuestionTypePicker } from "@/components/QuestionnaireV2/builder/QuestionTypePicker";
import { SubQuestionsList } from "@/components/QuestionnaireV2/builder/SubQuestionsList";
import { VisibilityConditionsCard } from "@/components/QuestionnaireV2/builder/VisibilityConditionsCard";
import { CollapsibleSettingsCard } from "@/components/QuestionnaireV2/shared/CollapsibleSettingsCard";

import { CodingEditor } from "@/components/Questionnaire/CodingEditor";

import { Question } from "@/types/questionnaire/question";

interface QuestionEditorCardProps {
  question: Question;
  number: string;
  allQuestions: Question[];
  dispatch: Dispatch<BuilderAction>;
}

interface QuestionCodeFieldProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
}

function QuestionCodeField({ question, onChange }: QuestionCodeFieldProps) {
  const { t } = useTranslation();
  // CodingEditor requires a react-hook-form instance purely to report field
  // errors through its API; this form is never submitted, it exists only to
  // satisfy that prop contract.
  const form = useForm();

  return (
    <CollapsibleSettingsCard
      title={t("coding_details")}
      badge={
        question.code?.display ? (
          <Badge variant="green">
            <Check className="size-3" />
            {t("code_verified")}
          </Badge>
        ) : undefined
      }
    >
      <CodingEditor
        code={question.code}
        name="code"
        form={form}
        onChange={(code) => onChange({ code })}
      />
    </CollapsibleSettingsCard>
  );
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
    onChange(patch);
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-sm text-gray-500">{number}</span>
            <span className="truncate text-sm font-semibold text-gray-900">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
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
          <Label>{t("question_title")}</Label>
          <Input
            value={question.text}
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

        {(question.type === "choice" || question.type === "quantity") && (
          <AnswerOptionsEditor question={question} onChange={onChange} />
        )}

        <div className="space-y-1.5">
          <Label>{t("description")}</Label>
          <Input
            value={question.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>

        <QuestionCodeField question={question} onChange={onChange} />

        <BehaviourSettingsCard question={question} onChange={onChange} />

        <VisibilityConditionsCard
          question={question}
          allQuestions={allQuestions}
          onChange={onChange}
        />

        {question.type === "group" && (
          <SubQuestionsList question={question} dispatch={dispatch} />
        )}
      </CardContent>
    </Card>
  );
}
