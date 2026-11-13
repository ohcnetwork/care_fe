import type { ActionOutcome } from "@/types/questionnaire/actions";

/**
 * What a record's actions reported back on a successful write.
 *
 * Every viewset that evaluates actions attaches the same `_actions` list
 * to its response — `{slug, instruction_type, results}` per instruction
 * that ran (questionnaire submit, appointment creation today; `{}` when
 * the record has no actions). The batch endpoint carries it through on
 * each sub-result's `data`. Read structurally, so no route has to declare
 * it: the mutation cache hands every successful response through here
 * (see `Utils/request/queryClient.ts`).
 */

function isOutcome(value: unknown): value is ActionOutcome {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ActionOutcome).slug === "string" &&
    typeof (value as ActionOutcome).instruction_type === "string"
  );
}

/** `_actions` is a flat list for a questionnaire submit, but one list PER
 *  configuration for a record with action configurations
 *  (`EMRActionBaseViewSet.perform_actions` appends each evaluation's
 *  results) — so one level of nesting is flattened here. */
function outcomesOf(body: unknown): ActionOutcome[] {
  if (typeof body !== "object" || body === null) return [];
  const actions = (body as { _actions?: unknown })._actions;
  if (!Array.isArray(actions)) return [];
  return actions
    .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
    .filter(isOutcome);
}

/** The outcomes on a response body — its own `_actions`, plus those of
 *  every sub-result when the body is a batch response. */
export function collectActionOutcomes(data: unknown): ActionOutcome[] {
  const outcomes = outcomesOf(data);
  const results = (data as { results?: unknown } | null)?.results;
  if (Array.isArray(results)) {
    for (const result of results) {
      outcomes.push(...outcomesOf((result as { data?: unknown } | null)?.data));
    }
  }
  return outcomes;
}

/** The human-readable text an instruction produced, when its `results`
 *  follow the `{message}` convention (or are a bare string). */
export function outcomeMessage(outcome: ActionOutcome): string | undefined {
  const results = outcome.results;
  if (typeof results === "string") return results.trim() || undefined;
  if (typeof results === "object" && results !== null) {
    const message = (results as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return undefined;
}
