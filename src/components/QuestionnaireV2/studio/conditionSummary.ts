import type { TFunction } from "i18next";

import type { EnableWhen, Question } from "@/types/questionnaire/question";

/** link_id → question. Hosts build this ONCE per render pass (the canvas
 *  annotation renders per block, so an internal per-call build would still
 *  walk the tree once per question) and hand it to the summary helpers. */
export function questionsByLinkId(
  questions: Question[],
): Map<string, Question> {
  const index = new Map<string, Question>();
  const walk = (list: Question[]) => {
    for (const question of list) {
      if (!index.has(question.link_id)) index.set(question.link_id, question);
      walk(question.questions ?? []);
    }
  };
  walk(questions);
  return index;
}

function ruleText(
  condition: EnableWhen,
  targets: ReadonlyMap<string, Question>,
  t: TFunction,
): string {
  const target = targets.get(condition.question);
  const questionText =
    target?.text || target?.link_id || condition.question || "?";
  if (condition.operator === "exists") {
    return t("condition_rule_answered", { question: questionText });
  }
  return t("condition_rule", {
    question: questionText,
    operator: t(condition.operator).toLowerCase(),
    answer: String(condition.answer ?? ""),
  });
}

/**
 * Short chip text for the canvas: the single rule spelled out, or a count
 * when there are several ("Shown when 2 rules match").
 */
export function shortConditionSummary(
  question: Question,
  targets: ReadonlyMap<string, Question>,
  t: TFunction,
): string | null {
  const rules = question.enable_when ?? [];
  if (rules.length === 0) return null;
  if (rules.length === 1) {
    return t("shown_when", { summary: ruleText(rules[0], targets, t) });
  }
  return t("shown_when_n_rules", { count: rules.length });
}

/**
 * The Logic tab's "In plain words" sentence — every rule spelled out and
 * joined by the enable_behavior connective.
 */
export function plainWordsSummary(
  question: Question,
  targets: ReadonlyMap<string, Question>,
  t: TFunction,
): string {
  const rules = question.enable_when ?? [];
  if (rules.length === 0) return t("plain_words_always");
  const joiner =
    question.enable_behavior === "any"
      ? ` ${t("or").toLowerCase()} `
      : ` ${t("and").toLowerCase()} `;
  return t("plain_words_shown_when", {
    summary: rules.map((rule) => ruleText(rule, targets, t)).join(joiner),
  });
}
