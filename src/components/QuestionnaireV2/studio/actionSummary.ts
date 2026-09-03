import type { TFunction } from "i18next";

import { parseCondition } from "@/components/QuestionnaireV2/shared/actionExpression";

import {
  ContextValueVariable,
  QuestionVariable,
  questionOfRef,
} from "@/components/QuestionnaireV2/builder/actionVariables";
import {
  contextValueLabel,
  instructionLabel,
  operatorLabel,
  questionLabel,
} from "@/components/QuestionnaireV2/builder/actions/labels";

import type { QuestionnaireAction } from "@/types/questionnaire/actions";

/**
 * The one line an author scans per action card — the counterpart of
 * `conditionSummary.ts` for visibility rules. Reads the condition through
 * the same parser the editor uses; a custom expression is quoted verbatim.
 */
export function actionPlainWords(
  action: QuestionnaireAction,
  questions: QuestionVariable[],
  contextValues: ContextValueVariable[],
  t: TFunction,
): string {
  const parsed = parseCondition(action.condition);
  let when: string;
  if (!parsed) {
    when = t("action_plain_when_expression", {
      expression: action.condition.trim(),
    });
  } else if (parsed.rules.length === 0) {
    when = t("action_plain_every_submission");
  } else {
    const joiner =
      parsed.behavior === "any"
        ? ` ${t("or").toLowerCase()} `
        : ` ${t("and").toLowerCase()} `;
    const clauses = parsed.rules.map((rule) => {
      const target = questionOfRef(rule.ref, questions);
      const contextValue = contextValues.find((v) => v.ref === rule.ref);
      const field = target
        ? questionLabel(target.question, t)
        : contextValue
          ? contextValueLabel(contextValue)
          : rule.ref;
      const value =
        typeof rule.value === "boolean"
          ? t(rule.value ? "yes" : "no")
          : String(rule.value);
      return t("action_plain_rule", {
        field,
        operator: operatorLabel(rule.operator, t).toLowerCase(),
        value,
      });
    });
    when = t("action_plain_when", { rules: clauses.join(joiner) });
  }
  const then =
    action.instructions.length === 0
      ? t("action_plain_nothing")
      : action.instructions
          .map((instruction) =>
            instruction.slug ? instructionLabel(instruction.slug, t) : "?",
          )
          .join(", ");
  return t("action_plain_sentence", { when, then });
}
