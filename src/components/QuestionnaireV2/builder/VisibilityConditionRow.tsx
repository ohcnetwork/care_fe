import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { buildCondition } from "@/components/QuestionnaireV2/builder/builderReducer";
import { NON_RESPONSE_TYPES } from "@/components/QuestionnaireV2/builder/saveValidation";

import {
  EnableWhen,
  Question,
  QuestionType,
} from "@/types/questionnaire/question";

import { VisibilityConditionAnswerInput } from "./VisibilityConditionAnswerInput";

type ConditionOperator = EnableWhen["operator"];

const BOOLEAN_OPERATORS = [
  "exists",
  "equals",
  "not_equals",
] as const satisfies readonly ConditionOperator[];
const NUMERIC_OPERATORS = [
  "greater",
  "less",
  "greater_or_equals",
  "less_or_equals",
  "equals",
  "not_equals",
  "exists",
] as const satisfies readonly ConditionOperator[];
const STRING_OPERATORS = [
  "equals",
  "not_equals",
  "exists",
] as const satisfies readonly ConditionOperator[];

function operatorsForType(
  type: QuestionType | undefined,
): readonly ConditionOperator[] {
  if (type === "boolean") return BOOLEAN_OPERATORS;
  if (type === "integer" || type === "decimal") return NUMERIC_OPERATORS;
  return STRING_OPERATORS;
}

function buildEnableWhen(
  targetLinkId: string,
  targetType: QuestionType | undefined,
  operator: ConditionOperator,
): EnableWhen {
  // A fresh `exists` rule reads "has been answered"; the other operators start
  // from the empty answer of their own shape (`buildCondition` coerces).
  const answer =
    operator === "exists" ? true : targetType === "boolean" ? "No" : "";
  return buildCondition(targetLinkId, operator, answer);
}

interface VisibilityConditionRowProps {
  condition: EnableWhen;
  index: number;
  behavior: "all" | "any";
  availableTargets: Question[];
  flatQuestions: Question[];
  onChange: (condition: EnableWhen) => void;
  onRemove: () => void;
}

export function VisibilityConditionRow({
  condition,
  index,
  behavior,
  availableTargets,
  flatQuestions,
  onChange,
  onRemove,
}: VisibilityConditionRowProps) {
  const { t } = useTranslation();
  const handleQuestionChange = (linkId: string) => {
    const target = availableTargets.find(
      (question) => question.link_id === linkId,
    );
    const operators = operatorsForType(target?.type);
    onChange(buildEnableWhen(linkId, target?.type, operators[0]));
  };

  const handleOperatorChange = (operator: ConditionOperator) => {
    // `exists` stores a literal boolean; comparisons use the target's
    // own answer shape. Reset it when leaving the presence check.
    onChange(
      condition.operator === "exists" && operator !== "exists"
        ? buildEnableWhen(
            condition.question,
            availableTargets.find(
              (question) => question.link_id === condition.question,
            )?.type,
            operator,
          )
        : buildCondition(condition.question, operator, condition.answer),
    );
  };

  const target = availableTargets.find((q) => q.link_id === condition.question);
  const operators = operatorsForType(target?.type);
  // A saved condition may target a question the renderer never
  // answers; surface it as invalid instead of keeping it silently.
  const invalidTarget = condition.question
    ? flatQuestions.find(
        (q) =>
          q.link_id === condition.question &&
          NON_RESPONSE_TYPES.includes(q.type),
      )
    : undefined;

  return (
    <div>
      {index > 0 && (
        <div className="relative flex justify-start py-1 pl-6">
          <span
            className="absolute left-[1.375rem] top-0 h-full w-px bg-gray-200"
            aria-hidden
          />
          <span className="relative rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold uppercase text-gray-500">
            {behavior === "all" ? t("and") : t("or")}
          </span>
        </div>
      )}
      <div className="space-y-2 rounded-md bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {t("condition_n", { n: index + 1 })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onRemove}
            aria-label={t("delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {/* Give the question the full first row; operator and answer
              share the second row. */}
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs text-gray-500">{t("question")}</p>
            <Select
              value={condition.question || undefined}
              onValueChange={handleQuestionChange}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={Boolean(invalidTarget)}
              >
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
              <SelectContent>
                {/* Keep the saved invalid target visible, but prevent it
                    from being selected again. */}
                {invalidTarget && (
                  <SelectItem
                    value={invalidTarget.link_id}
                    disabled
                    className="text-red-600"
                  >
                    {invalidTarget.text || t("untitled_question")}
                  </SelectItem>
                )}
                {availableTargets.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.link_id}>
                    {candidate.text || t("untitled_question")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {invalidTarget && (
              <p className="text-xs text-red-600">
                {t("condition_target_not_answerable")}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500">{t("operator")}</p>
            <Select
              value={condition.operator}
              onValueChange={(value) => {
                // Radix hands back a bare string — resolve it against
                // the offered operators instead of asserting.
                const operator = operators.find((o) => o === value);
                if (operator) handleOperatorChange(operator);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((operator) => (
                  <SelectItem key={operator} value={operator}>
                    {t(operator)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500">{t("answer")}</p>
            <VisibilityConditionAnswerInput
              condition={condition}
              targetType={target?.type}
              onChange={(answer) =>
                onChange(
                  buildCondition(
                    condition.question,
                    condition.operator,
                    answer,
                  ),
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
