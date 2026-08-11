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
 * Compatibility-aware draft merge: when the live questionnaire has changed
 * since a draft was stored, restore every answer that still fits and NAME
 * what doesn't — never discard the whole draft, never drop silently. Pure
 * decision layer behind every restore path; see `mergeDraftResponses` for
 * the compatibility rules.
 */

/** Why one stored answer could not be carried onto the current
 *  questionnaire — the restore bar's notice exists to NAME these, not just
 *  drop the value silently. */
export type DraftDropReason =
  "question_removed" | "type_changed" | "option_removed";

export interface DroppedDraftAnswer {
  questionId: string;
  /** Best available label: the question's live `text`, except for
   *  `question_removed`, where no `Question` remains to read text from and
   *  the stored response's `link_id` is the only name available. */
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
 * `ResponseValue.type` tags that each plain `QuestionType` can write. Stored
 * responses keep value shape rather than the original question type, so a
 * current question can restore only entries whose value tags it can produce.
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
 * Choice/quantity answers restore only if the stored value/coding still
 * matches a currently-available option. Only verifiable for a FIXED
 * option list known at merge time from the live `Question`
 * (`answer_option` for choice, `unit` for quantity): an
 * `answer_value_set`-backed question's real option set lives in a remote
 * valueset this pure, synchronous merge cannot expand — those restore
 * as-is (trusted, not verified).
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

/**
 * Whether a stored response contains draft-worthy data: any recorded value,
 * or a note the clinician typed.
 */
export function draftResponseHasContent(
  response: QuestionnaireResponse,
): boolean {
  if (response.values.some(entryHasContent)) return true;
  return !!response.note;
}

/**
 * Merge a stored draft onto the current questionnaire. Removed questions,
 * incompatible value shapes, changed structured types and unavailable fixed
 * choice/quantity options are reported with machine reasons; everything still
 * compatible restores onto a fresh initialized response map.
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
      if (draftResponseHasContent(response)) {
        dropped.push({
          questionId: id,
          label: response.link_id || id,
          reason: "question_removed",
        });
      }
      continue;
    }

    // Structured: whole-response gate on structured_type — the values are
    // that type's own request objects, opaque to this merge, so they either
    // carry whole (same type) or drop whole (type changed).
    if (fresh.type === "structured" || response.structured_type) {
      if (fresh.structured_type !== response.structured_type) {
        if (draftResponseHasContent(response)) {
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
      if (draftResponseHasContent(response)) {
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
