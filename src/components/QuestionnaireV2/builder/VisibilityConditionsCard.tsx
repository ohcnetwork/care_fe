import { Check, Plus } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";
import { CollapsibleSettingsCard } from "@/components/QuestionnaireV2/shared/CollapsibleSettingsCard";

import { collectIds } from "@/components/QuestionnaireV2/builder/builderReducer";
import { NON_RESPONSE_TYPES } from "@/components/QuestionnaireV2/builder/saveValidation";

import { EnableWhen, Question } from "@/types/questionnaire/question";

import { useEditorRowKeys } from "./useEditorRowKeys";
import { VisibilityConditionRow } from "./VisibilityConditionRow";

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

function flattenQuestions(questions: Question[]): Question[] {
  return questions.flatMap((question) => [
    question,
    ...flattenQuestions(question.questions ?? []),
  ]);
}

export function VisibilityConditionsCard({
  question,
  allQuestions,
  onChange,
  bare = false,
}: VisibilityConditionsCardProps) {
  const { t } = useTranslation();
  const radioGroupName = useId();
  const enableWhen = question.enable_when ?? [];
  const { rowKeys, removeRowKey } = useEditorRowKeys(
    question.id,
    enableWhen.length,
  );
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

  const handleAddCondition = () => {
    updateConditions([
      ...enableWhen,
      { question: "", operator: "equals", answer: "" },
    ]);
  };

  const handleDeleteCondition = (index: number) => {
    removeRowKey(index);
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
          <div
            role="radiogroup"
            aria-label={t("show_question_when")}
            className="flex flex-wrap gap-2"
          >
            <ChoiceChip
              control="radio"
              name={radioGroupName}
              label={t("all_conditions_and")}
              checked={enableBehavior === "all"}
              onCheckedChange={() => onChange({ enable_behavior: "all" })}
            />
            <ChoiceChip
              control="radio"
              name={radioGroupName}
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
        {enableWhen.map((condition, index) => (
          <VisibilityConditionRow
            key={rowKeys[index]}
            condition={condition}
            index={index}
            behavior={enableBehavior}
            availableTargets={availableTargets}
            flatQuestions={flatQuestions}
            onChange={(next) =>
              updateConditions(
                enableWhen.map((existing, i) =>
                  i === index ? next : existing,
                ),
              )
            }
            onRemove={() => handleDeleteCondition(index)}
          />
        ))}
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
