import type { TFunction } from "i18next";

import {
  ContextPathOption,
  ContextValueVariable,
  QuestionVariable,
  SELF_CONTEXT_PATH,
  UnusableReason,
} from "@/components/QuestionnaireV2/builder/actionVariables";
import type { ActionRuleOperator } from "@/components/QuestionnaireV2/shared/actionExpression";
import { humanize } from "@/Utils/actions/instructionLabels";

import type { Question } from "@/types/questionnaire/question";

/** The questionnaire answers and registry context values available to editors. */
export interface ActionVariableSources {
  questions: QuestionVariable[];
  contextValues: ContextValueVariable[];
}

export {
  humanize,
  instructionLabel,
  instructionTypeLabel,
} from "@/Utils/actions/instructionLabels";

const OPERATOR_LABEL_KEYS: Record<ActionRuleOperator, string> = {
  "==": "equals",
  "!=": "not_equals",
  ">": "greater",
  ">=": "greater_or_equals",
  "<": "less",
  "<=": "less_or_equals",
  in: "action_operator_contains",
  "not in": "action_operator_not_contains",
};

export function operatorLabel(operator: ActionRuleOperator, t: TFunction) {
  return t(OPERATOR_LABEL_KEYS[operator]);
}

export function questionLabel(question: Question, t: TFunction): string {
  return question.text || t("untitled_question");
}

/** "Patient › Age" */
export function contextValueLabel(variable: ContextValueVariable): string {
  return variable.segments.map(humanize).join(" › ");
}

/** "This submission" for the root, otherwise the typed neighbour's name. */
export function contextPathLabel(
  option: ContextPathOption,
  t: TFunction,
): string {
  if (option.path === SELF_CONTEXT_PATH) return t("action_context_self");
  return option.path.split(".").map(humanize).join(" › ");
}

const UNUSABLE_REASON_KEYS: Record<UnusableReason, string> = {
  link_id: "action_unusable_link_id",
  type: "action_unusable_type",
  coded_multi: "action_unusable_coded_multi",
  repeating_group: "action_unusable_repeating_group",
};

/** Why a question is listed but cannot be picked. */
export function unusableReasonLabel(reason: UnusableReason, t: TFunction) {
  return t(UNUSABLE_REASON_KEYS[reason]);
}
