import { Check, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";
import { CollapsibleSettingsCard } from "@/components/QuestionnaireV2/shared/CollapsibleSettingsCard";

import {
  collectIds,
  normalizeBooleanConditionAnswer,
} from "@/components/QuestionnaireV2/builder/builderReducer";
import { NON_RESPONSE_TYPES } from "@/components/QuestionnaireV2/builder/saveValidation";

import {
  EnableWhen,
  Question,
  QuestionType,
} from "@/types/questionnaire/question";

interface VisibilityConditionsCardProps {
  question: Question;
  allQuestions: Question[];
  onChange: (patch: Partial<Question>) => void;
  /** Render the rule editor without the collapsible card shell — the
   *  studio inspector hosts it flat inside its Logic tab, adding the
   *  reference design's "Always shown" empty state and gating the AND/OR
   *  chips on rules existing. */
  bare?: boolean;
}

const BOOLEAN_OPERATORS = ["exists", "equals", "not_equals"] as const;
const NUMERIC_OPERATORS = [
  "greater",
  "less",
  "greater_or_equals",
  "less_or_equals",
] as const;
const STRING_OPERATORS = ["equals", "not_equals"] as const;

function flattenQuestions(questions: Question[]): Question[] {
  return questions.flatMap((question) => [
    question,
    ...flattenQuestions(question.questions ?? []),
  ]);
}

function operatorsForType(type: QuestionType | undefined): readonly string[] {
  if (type === "boolean") return BOOLEAN_OPERATORS;
  if (type === "integer" || type === "decimal") return NUMERIC_OPERATORS;
  return STRING_OPERATORS;
}

function buildEnableWhen(
  targetLinkId: string,
  targetType: QuestionType | undefined,
  operator: string,
): EnableWhen {
  if (targetType === "boolean") {
    return {
      question: targetLinkId,
      operator,
      // "Yes"/"No" string, matching the legacy editor's storage format (see
      // normalizeBooleanConditionAnswer above).
      answer: "No",
    } as EnableWhen;
  }
  if (targetType === "integer" || targetType === "decimal") {
    return {
      question: targetLinkId,
      operator: operator as
        "greater" | "less" | "greater_or_equals" | "less_or_equals",
      answer: 0,
    };
  }
  return {
    question: targetLinkId,
    operator: operator as "equals" | "not_equals",
    answer: "",
  };
}

export function VisibilityConditionsCard({
  question,
  allQuestions,
  onChange,
  bare = false,
}: VisibilityConditionsCardProps) {
  const { t } = useTranslation();
  const enableWhen = question.enable_when ?? [];
  const enableBehavior = question.enable_behavior ?? "all";
  const excludedIds = new Set(collectIds(question));
  const flatQuestions = flattenQuestions(allQuestions);
  const availableTargets = flatQuestions.filter(
    (candidate) =>
      !excludedIds.has(candidate.id) &&
      !NON_RESPONSE_TYPES.includes(candidate.type),
  );

  const updateConditions = (next: EnableWhen[]) => {
    onChange({ enable_when: next });
  };

  const handleQuestionChange = (index: number, linkId: string) => {
    const target = availableTargets.find((q) => q.link_id === linkId);
    const operators = operatorsForType(target?.type);
    const next = [...enableWhen];
    next[index] = buildEnableWhen(linkId, target?.type, operators[0]);
    updateConditions(next);
  };

  const handleOperatorChange = (index: number, operator: string) => {
    const next = [...enableWhen];
    next[index] = { ...next[index], operator } as EnableWhen;
    updateConditions(next);
  };

  const handleAnswerChange = (
    index: number,
    rawValue: string,
    targetType: QuestionType | undefined,
  ) => {
    const next = [...enableWhen];
    let answer: EnableWhen["answer"];
    if (targetType === "boolean") {
      answer = normalizeBooleanConditionAnswer(rawValue);
    } else if (targetType === "integer" || targetType === "decimal") {
      answer = Number(rawValue) || 0;
    } else {
      answer = rawValue;
    }
    next[index] = { ...next[index], answer } as EnableWhen;
    updateConditions(next);
  };

  const handleAddCondition = () => {
    updateConditions([
      ...enableWhen,
      { question: "", operator: "equals", answer: "" },
    ]);
  };

  const handleDeleteCondition = (index: number) => {
    updateConditions(enableWhen.filter((_, i) => i !== index));
  };

  const content = (
    <div className="space-y-3">
      {/* In bare (tab) mode the AND/OR choice only appears once there is
            a rule to combine — the reference's empty state takes its place. */}
      {(!bare || enableWhen.length > 0) && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">
            {t("show_question_when")}
          </p>
          <div className="flex flex-wrap gap-2">
            <ChoiceChip
              control="radio"
              label={t("all_conditions_and")}
              checked={enableBehavior === "all"}
              onCheckedChange={() => onChange({ enable_behavior: "all" })}
            />
            <ChoiceChip
              control="radio"
              label={t("any_condition_or")}
              checked={enableBehavior === "any"}
              onCheckedChange={() => onChange({ enable_behavior: "any" })}
            />
          </div>
        </div>
      )}

      {bare && enableWhen.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
          <p className="text-sm font-medium text-gray-900">
            {t("always_shown")}
          </p>
          <p className="text-xs text-gray-500">{t("always_shown_hint")}</p>
        </div>
      )}

      <div className="space-y-2">
        {enableWhen.map((condition, index) => {
          const target = availableTargets.find(
            (q) => q.link_id === condition.question,
          );
          const operators = operatorsForType(target?.type);
          // A saved condition (legacy data) may still target a question
          // the renderer never answers — surface it as invalid instead of
          // silently keeping a condition that can never match.
          const invalidTarget = condition.question
            ? flatQuestions.find(
                (q) =>
                  q.link_id === condition.question &&
                  NON_RESPONSE_TYPES.includes(q.type),
              )
            : undefined;

          return (
            <div key={index}>
              {index > 0 && (
                <div className="relative flex justify-start py-1 pl-6">
                  <span
                    className="absolute left-[1.375rem] top-0 h-full w-px bg-gray-200"
                    aria-hidden
                  />
                  <span className="relative rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold uppercase text-gray-500">
                    {enableBehavior === "all" ? t("and") : t("or")}
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
                    onClick={() => handleDeleteCondition(index)}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {/* Question gets the full first row — it's the field the
                        author most needs to read; Operator and Answer pair
                        up on the second row. */}
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-gray-500">{t("question")}</p>
                    <Select
                      value={condition.question || undefined}
                      onValueChange={(value) =>
                        handleQuestionChange(index, value)
                      }
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={Boolean(invalidTarget)}
                      >
                        <SelectValue placeholder={t("select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Keeps the trigger showing the (invalid) saved
                              target's title instead of a blank; disabled so
                              it can't be re-picked. */}
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
                          <SelectItem
                            key={candidate.id}
                            value={candidate.link_id}
                          >
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
                      onValueChange={(value) =>
                        handleOperatorChange(index, value)
                      }
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
                    {target?.type === "boolean" ? (
                      <Select
                        // Tolerates legacy true/false answers on load; any
                        // change re-writes them as "Yes"/"No".
                        value={normalizeBooleanConditionAnswer(
                          condition.answer,
                        )}
                        onValueChange={(value) =>
                          handleAnswerChange(index, value, target?.type)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">{t("yes")}</SelectItem>
                          <SelectItem value="No">{t("no")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : target?.type === "integer" ||
                      target?.type === "decimal" ? (
                      <Input
                        type="number"
                        value={String(condition.answer ?? "")}
                        onChange={(e) =>
                          handleAnswerChange(
                            index,
                            e.target.value,
                            target?.type,
                          )
                        }
                      />
                    ) : (
                      <Input
                        value={String(condition.answer ?? "")}
                        onChange={(e) =>
                          handleAnswerChange(
                            index,
                            e.target.value,
                            target?.type,
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddCondition}
      >
        <Plus className="size-4" />
        {t("add_a_condition")}
      </Button>
    </div>
  );

  if (bare) return content;

  return (
    <CollapsibleSettingsCard
      title={t("question_visibility_title")}
      subtitle={t("question_visibility_subtitle")}
      badge={
        enableWhen.length > 0 ? (
          <Badge variant="green">
            <Check className="size-3" />
            {t("conditions_count", { count: enableWhen.length })}
          </Badge>
        ) : undefined
      }
    >
      {content}
    </CollapsibleSettingsCard>
  );
}
