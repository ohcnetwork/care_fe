import {
  entryHasContent,
  initializeResponses,
} from "@/components/QuestionnaireV2/form/engine/store";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question, QuestionType } from "@/types/questionnaire/question";

/**
 * Spec amendment A1 (`docs/superpowers/specs/2026-08-03-structured-
 * rearchitecture-design.md` §5) — the compatibility-aware MERGE that
 * replaces wholesale draft rejection on a questionnaire revision mismatch.
 *
 * Today (`fillDraftStore.ts`'s pre-A1 `loadFillDraft`) a stored draft whose
 * primary questionnaire version differs from the live one is discarded in
 * its ENTIRETY — every answer, on every question, gone — the instant a
 * questionnaire author edits so much as one unrelated question's label.
 * A1's ruling: restore what still fits, and NAME what doesn't, never drop
 * silently. This module is the pure decision layer both restore paths
 * (`fillDraftStore.ts`'s primary-form resume and the P2-3 "questionnaire
 * updated — reload" banner) share — see `mergeDraftResponses`'s doc
 * comment for the carry-over rules.
 */

/** Why one stored answer could not be carried onto the current
 *  questionnaire — the restore bar's notice exists to NAME these, not just
 *  drop the value silently (A1's central requirement). */
export type DraftDropReason =
  "question_removed" | "type_changed" | "option_removed";

export interface DroppedDraftAnswer {
  questionId: string;
  /** Best available label. A question that no longer exists in the fresh
   *  tree has no `Question` left to read text from — the stored response
   *  itself carries only `link_id`, so that is this reason's fallback
   *  name (see the REMOVED-QUESTION LABEL LIMITATION note below). Every
   *  other reason names the question's live `text`. */
  label: string;
  reason: DraftDropReason;
}

export interface DraftMergeResult {
  responses: Record<string, QuestionnaireResponse>;
  dropped: DroppedDraftAnswer[];
}

/** Flattened id → Question index, built once per merge call. */
function indexQuestions(questions: Question[]): Map<string, Question> {
  const byId = new Map<string, Question>();
  const walk = (list: Question[]) => {
    for (const question of list) {
      if (question.type !== "group") byId.set(question.id, question);
      if (question.questions) walk(question.questions);
    }
  };
  walk(questions);
  return byId;
}

/**
 * The `ResponseValue.type` tags a PLAIN (non-structured) question's own
 * `QuestionType` can legitimately write — the mirror image of each input
 * component's own write ((`form/engine/inputs/*`): BooleanInput ->
 * "boolean", NumberInput -> "number" (decimal/integer), DateInput ->
 * "date", DateTimeQuestionInput -> "dateTime", TimeInput -> "time",
 * TextInput/ChoiceInput -> "string", QuantityInput -> "quantity".
 *
 * This is the ONLY signal available for "does the question id still exist
 * with the same type" (spec A1's wording) for a plain question: the stored
 * response never retains the OLD `Question.type` it was answered under,
 * only the shape of the VALUE it wrote. A response whose entries don't fit
 * any bucket the CURRENT question type can produce is treated as a type
 * change. `group`/`display` are absent — neither ever holds a response.
 */
const EXPECTED_VALUE_TYPES: Partial<
  Record<QuestionType, ReadonlyArray<ResponseValue["type"]>>
> = {
  boolean: ["boolean"],
  decimal: ["number"],
  integer: ["number"],
  date: ["date"],
  dateTime: ["dateTime"],
  time: ["time"],
  string: ["string"],
  text: ["string"],
  url: ["string"],
  choice: ["string"],
  quantity: ["quantity"],
};

function valueTypeMatchesQuestion(
  question: Question,
  entry: ResponseValue,
): boolean {
  const expected = EXPECTED_VALUE_TYPES[question.type];
  // No expectation on file for this question type (group/display, or a
  // future type this table hasn't learned yet) — nothing to disqualify
  // the entry on, so it is treated as compatible rather than dropped.
  return !expected || expected.includes(entry.type);
}

/**
 * Choice/quantity "currently-available option" rule (spec A1: "Choice/
 * quantity answers restore only if the stored coding/value still matches
 * a currently-available option").
 *
 * SCOPE, STATED HONESTLY: only verifiable for a FIXED option list known at
 * merge time from the live `Question` — `answer_option` for choice,
 * `unit` (no `answer_value_set`) for quantity. A `answer_value_set`-backed
 * question's real option set lives in a remote valueset this pure,
 * synchronous merge cannot expand — those are restored AS-IS (trusted,
 * not verified) rather than silently blocked from ever restoring. This is
 * a deliberate, documented narrowing, not an oversight: the three mount-
 * verification scenarios the plan calls for (question removed, choice
 * option removed, question type changed) are all the `answer_option`
 * case, which this DOES cover completely.
 */
function choiceValueStillAvailable(
  question: Question,
  entry: ResponseValue,
): boolean {
  if (!question.answer_option?.length) return true;
  const stored = entry.value == null ? undefined : String(entry.value);
  return question.answer_option.some((option) => option.value === stored);
}

function quantityUnitStillAvailable(
  question: Question,
  entry: ResponseValue,
): boolean {
  if (question.answer_value_set) return true; // dynamic — not verifiable here
  if (!question.unit) return true; // no fixed unit declared — nothing to check
  if (entry.type !== "quantity") return true; // shape check is a separate rule
  const code = entry.coding ?? entry.unit;
  if (!code) return true; // nothing recorded to check against
  return (
    code.code === question.unit.code && code.system === question.unit.system
  );
}

/** Filters one response's `values` down to entries still compatible with
 *  the CURRENT question's options — choice/quantity only; every other
 *  type's entries pass through untouched (nothing to narrow). */
function filterAvailableEntries(
  question: Question,
  values: ResponseValue[],
): { kept: ResponseValue[]; anyDropped: boolean } {
  if (question.type === "choice") {
    const kept = values.filter((entry) =>
      choiceValueStillAvailable(question, entry),
    );
    return { kept, anyDropped: kept.length !== values.length };
  }
  if (question.type === "quantity") {
    const kept = values.filter((entry) =>
      quantityUnitStillAvailable(question, entry),
    );
    return { kept, anyDropped: kept.length !== values.length };
  }
  return { kept: values, anyDropped: false };
}

/** Does this stored response hold anything worth reporting as dropped?
 *  Mirrors `fillDraftStore.ts`'s `draftResponseHasContent` (values, edits,
 *  note) but kept LOCAL rather than imported — importing it would create a
 *  circular dependency (`fillDraftStore.ts` imports `mergeDraftResponses`
 *  from this module). */
function hasRestorableContent(response: QuestionnaireResponse): boolean {
  if (response.values.some(entryHasContent)) return true;
  if ((response.edits?.length ?? 0) > 0) return true;
  return !!response.note;
}

/**
 * The A1 carry-over decision, as a pure function: given the CURRENT
 * questionnaire's questions and a stored draft's responses, returns the
 * merged response map (seeded fresh, then overlaid per the rules below)
 * plus every answer that could not be carried over, with a machine reason
 * the restore bar can translate and label.
 *
 * CARRY-OVER RULES (spec A1):
 *  - The question id no longer exists in the current tree -> DROPPED
 *    (`question_removed`). No live `Question` remains to read a label
 *    from, so the notice falls back to the stored response's `link_id`.
 *  - The question exists but the recorded value's shape doesn't fit what
 *    the CURRENT question type can produce (`EXPECTED_VALUE_TYPES`) ->
 *    DROPPED (`type_changed`), the whole response (not just the mismatched
 *    entries — a type change invalidates the answer's meaning, not just
 *    its encoding).
 *  - A structured question whose `structured_type` differs from what the
 *    draft recorded -> DROPPED (`type_changed`) at this SAME whole-
 *    response level, before `useStructuredRows` (per-`rowId` baseline
 *    reconciliation) ever mounts. A structured question whose type still
 *    matches restores its edit log verbatim — `useStructuredRows`'
 *    existing `droppedEdits` channel (Phase 2) is what then names any
 *    individual row a REFETCHED BASELINE turns out not to have; this
 *    function only decides whether the section applies at all.
 *  - Choice/quantity: entries whose stored value/coding no longer matches
 *    a `answer_option`/fixed-`unit` the current question declares are
 *    filtered out of that ONE response -> reported (`option_removed`);
 *    whatever remains restores. See `filterAvailableEntries`'s doc
 *    comment for the valueset-backed scope limitation.
 *  - Everything else (plain answers whose type still fits, a structured
 *    question whose type still matches, an untouched/empty response)
 *    restores unchanged.
 *
 * A response with nothing worth restoring (`hasRestorableContent` false)
 * is never reported as dropped even when a rule above would otherwise
 * exclude it — there is nothing lost to name.
 *
 * `questions` seeds the base via `initializeResponses` exactly like the
 * pre-A1 `mergeDraftIntoSeed` did, so a question the draft never mentions
 * (added since, or simply unanswered) still gets its normal fresh/initial
 * response.
 */
export function mergeDraftResponses(
  questions: Question[],
  draft: Record<string, QuestionnaireResponse>,
): DraftMergeResult {
  const byId = indexQuestions(questions);
  const merged = initializeResponses(questions);
  const dropped: DroppedDraftAnswer[] = [];

  for (const [id, response] of Object.entries(draft)) {
    const fresh = byId.get(id);

    if (!fresh) {
      if (hasRestorableContent(response)) {
        dropped.push({
          questionId: id,
          label: response.link_id || id,
          reason: "question_removed",
        });
      }
      continue;
    }

    // Structured: whole-response gate on structured_type. Per-row
    // reconciliation against the refetched baseline is
    // `useStructuredRows`'s job (droppedEdits), not this function's.
    if (fresh.type === "structured" || response.structured_type) {
      if (fresh.structured_type !== response.structured_type) {
        if (hasRestorableContent(response)) {
          dropped.push({
            questionId: id,
            label: fresh.text,
            reason: "type_changed",
          });
        }
        continue;
      }
      merged[id] = { ...response, link_id: fresh.link_id };
      continue;
    }

    // Plain question: the recorded VALUE SHAPE must still fit what the
    // current question type can produce.
    const shapeCompatible = response.values.every((entry) =>
      valueTypeMatchesQuestion(fresh, entry),
    );
    if (!shapeCompatible) {
      if (hasRestorableContent(response)) {
        dropped.push({
          questionId: id,
          label: fresh.text,
          reason: "type_changed",
        });
      }
      continue;
    }

    const { kept, anyDropped } = filterAvailableEntries(fresh, response.values);
    if (anyDropped) {
      dropped.push({
        questionId: id,
        label: fresh.text,
        reason: "option_removed",
      });
    }

    merged[id] = {
      ...response,
      link_id: fresh.link_id,
      structured_type: fresh.structured_type ?? null,
      values: kept,
    };
  }

  return { responses: merged, dropped };
}
