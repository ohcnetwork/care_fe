import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import {
  ActionRule,
  ActionRuleBehavior,
  ActionRuleValue,
  compileCondition,
  parseCondition,
  questionRef,
  referenceableLinkId,
} from "@/components/QuestionnaireV2/shared/actionExpression";
import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";

import {
  AnswerShape,
  QuestionVariable,
  operatorsFor,
} from "@/components/QuestionnaireV2/builder/actionVariables";
import { useEditorRowKeys } from "@/components/QuestionnaireV2/builder/useEditorRowKeys";

import { Question } from "@/types/questionnaire/question";
import { ActionConditionRow } from "./ActionConditionRow";
import { ActionConditionWarnings } from "./ActionConditionWarnings";
import { ActionExpressionEditor } from "./ActionExpressionEditor";
import { contextFieldInput } from "./contextFieldInput";
import { ActionVariableSources } from "./labels";

interface ActionConditionEditorProps {
  /** Stable DOM id prefix for this action's controls. */
  idPrefix: string;
  condition: string;
  onChange: (condition: string) => void;
  sources: ActionVariableSources;
  /** A legacy `Q-…` link id was picked: rename it so it can be named from
   *  an expression (the reducer follows the rename through enable_when and
   *  every action). */
  onRenameLinkId: (questionId: string, linkId: string) => void;
  onMarkRequired: (questionId: string) => void;
}

/** The value a fresh rule starts with, so every row compiles from the
 *  moment it exists — a half-built row would have no valid expression to
 *  persist. */
function defaultValue(
  shape: AnswerShape | undefined,
  question: Question | undefined,
): ActionRuleValue {
  switch (shape) {
    case "boolean":
      return true;
    case "number":
      return 0;
    case "choice":
    case "choice_multi":
      return question?.answer_option?.[0]?.value ?? "";
    default:
      return "";
  }
}

/**
 * The "When" half of an action. Two faces over one stored string: the rule
 * builder (field / operator / value rows joined by AND or OR) for the
 * canonical subset `actionExpression` round-trips, and a plain expression
 * editor for everything else. Mirrors the Logic tab's grammar: no rules
 * means "runs on every submission", the first "Add a condition" makes it
 * conditional, deleting the last rule takes it back.
 */
export function ActionConditionEditor({
  idPrefix,
  condition,
  onChange,
  sources,
  onRenameLinkId,
  onMarkRequired,
}: ActionConditionEditorProps) {
  const { t } = useTranslation();
  const { questions, contextValues } = sources;
  const parsed = parseCondition(condition);
  const { rowKeys, removeRowKey } = useEditorRowKeys(
    idPrefix,
    parsed?.rules.length ?? 0,
  );
  const [wantsExpression, setWantsExpression] = useState(false);
  const lastValidCondition = useRef(
    parsed ? condition : compileCondition([], "all"),
  );
  const expressionMode = wantsExpression || !parsed;
  const changeCondition = (next: string) => {
    if (parseCondition(next)) lastValidCondition.current = next;
    onChange(next);
  };

  // Everything in the tree, for the rename's collision check.
  const takenLinkIds = new Set(
    questions.map((entry) => entry.question.link_id),
  );
  const pickable = questions.filter(
    (entry) => !entry.unusable || entry.unusable === "link_id",
  );
  const canAddRule = pickable.length > 0 || contextValues.length > 0;

  const update = (rules: ActionRule[], behavior: ActionRuleBehavior) =>
    changeCondition(compileCondition(rules, behavior));

  /** The ref a picked question should be stored under — renaming a
   *  legacy link id on the way, since `q_Q-1234` is not a name. */
  const resolveRef = (entry: QuestionVariable): string => {
    if (entry.unusable !== "link_id") return entry.ref;
    const linkId = referenceableLinkId(entry.question.link_id, takenLinkIds);
    onRenameLinkId(entry.question.id, linkId);
    return entry.ref.replace(
      questionRef(entry.question.link_id),
      questionRef(linkId),
    );
  };

  const freshRule = (entry: QuestionVariable | undefined, ref: string) => {
    const fieldInput = contextFieldInput(
      contextValues.find((value) => value.ref === ref),
    );
    const shape = entry?.shape ?? fieldInput?.shape;
    return {
      ref,
      operator: operatorsFor(shape)[0],
      value:
        fieldInput?.options?.[0]?.value ?? defaultValue(shape, entry?.question),
    };
  };

  const addRule = () => {
    if (!parsed) return;
    const first = pickable.find((entry) => !entry.unusable) ?? pickable[0];
    const ref = first ? resolveRef(first) : contextValues[0]?.ref;
    if (!ref) return;
    update([...parsed.rules, freshRule(first, ref)], parsed.behavior);
  };

  const setRule = (index: number, rule: ActionRule) => {
    if (!parsed) return;
    const rules = [...parsed.rules];
    rules[index] = rule;
    update(rules, parsed.behavior);
  };

  if (expressionMode) {
    return (
      <ActionExpressionEditor
        idPrefix={idPrefix}
        condition={condition}
        sources={sources}
        canUseRules={!!parsed}
        showCustomExpressionNote={!parsed && !wantsExpression}
        onChange={changeCondition}
        onBackToConditions={() => setWantsExpression(false)}
        onReplaceCondition={() => {
          setWantsExpression(false);
          onChange(lastValidCondition.current);
        }}
      />
    );
  }

  const { rules, behavior } = parsed;

  return (
    <div className="space-y-3">
      {rules.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
          <p className="text-sm font-medium text-gray-900">
            {t("action_always_runs")}
          </p>
          <p className="text-xs text-gray-500">
            {t("action_always_runs_hint")}
          </p>
        </div>
      )}

      {rules.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">
            {t("action_run_when")}
          </p>
          <div className="flex flex-wrap gap-2">
            <ChoiceChip
              control="radio"
              label={t("all_conditions_and")}
              checked={behavior === "all"}
              onCheckedChange={() => update(rules, "all")}
            />
            <ChoiceChip
              control="radio"
              label={t("any_condition_or")}
              checked={behavior === "any"}
              onCheckedChange={() => update(rules, "any")}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule, index) => (
          <ActionConditionRow
            key={rowKeys[index]}
            rule={rule}
            index={index}
            behavior={behavior}
            sources={sources}
            onSelectField={(picked) => {
              const entry = questions.find(
                (candidate) => candidate.ref === picked,
              );
              setRule(
                index,
                freshRule(entry, entry ? resolveRef(entry) : picked),
              );
            }}
            onChange={(next) => setRule(index, next)}
            onRemove={() => {
              removeRowKey(index);
              update(
                rules.filter((_, i) => i !== index),
                behavior,
              );
            }}
          />
        ))}
      </div>

      <ActionConditionWarnings
        rules={rules}
        questions={questions}
        onMarkRequired={onMarkRequired}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
          disabled={!canAddRule}
        >
          <Plus className="size-4" />
          {t("add_a_condition")}
        </Button>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => {
            lastValidCondition.current = condition;
            setWantsExpression(true);
          }}
        >
          {t("action_edit_as_expression")}
        </Button>
      </div>
      {!canAddRule && (
        <p className="text-xs text-gray-500">
          {t("action_no_fields_available")}
        </p>
      )}
    </div>
  );
}
