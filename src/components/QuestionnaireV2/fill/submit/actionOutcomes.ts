import type { ActionOutcome } from "@/types/questionnaire/actions";

/**
 * What the backend's questionnaire actions reported back on a successful
 * submission — the `_actions` list the submit view appends to its response
 * (`QuestionnaireViewSet.submit`), one entry per instruction that ran, and
 * carried through the batch endpoint as `results[i].data._actions`.
 *
 * Only the `{message}` convention the shipped instructions follow is read;
 * an outcome with no readable message is not shown. Other outcome shapes
 * (redirects, validation verdicts) get handled when an instruction that
 * produces them exists.
 */

interface BatchResultLike {
  reference_id?: string;
  data?: unknown;
}

function isOutcome(value: unknown): value is ActionOutcome {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ActionOutcome).slug === "string" &&
    typeof (value as ActionOutcome).instruction_type === "string"
  );
}

/**
 * The outcomes from every questionnaire-submit result in a batch response.
 * `submitReferenceIds` are the reference ids `composeBatch` gave those
 * requests (the questionnaire ids) — structured-type requests to domain
 * APIs and the draft-completion PUT never carry `_actions`.
 */
export function collectActionOutcomes(
  results: BatchResultLike[],
  submitReferenceIds: ReadonlySet<string>,
): ActionOutcome[] {
  const outcomes: ActionOutcome[] = [];
  for (const result of results) {
    if (!result.reference_id || !submitReferenceIds.has(result.reference_id)) {
      continue;
    }
    const actions = (result.data as { _actions?: unknown } | undefined)
      ?._actions;
    if (!Array.isArray(actions)) continue;
    for (const entry of actions) {
      if (isOutcome(entry)) outcomes.push(entry);
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
