import type { Code } from "@/types/base/code/code";
import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import type { PlainValueEntry, PlainValueInput } from "./types";

/**
 * The one choke point every assistant write to a PLAIN (non-structured)
 * question passes through. Deliberately dependency-free (no React, no
 * `@careConfig`-touching utils, no zod) so `node --test` can exercise it
 * directly — see `coercion.test.ts`. `Code`/`Question`/`ResponseValue`
 * are `import type` only, erased before `tsx` resolves any runtime
 * module.
 */

export type CoercionResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

function ok<T>(value: T): CoercionResult<T> {
  return { ok: true, value };
}

function fail<T>(error: string): CoercionResult<T> {
  return { ok: false, error };
}

/** What an assistant may supply as one repeat's raw input: the handle's
 *  own write shape, before any question-type coercion. Aliased rather
 *  than re-spelled so the published contract and the value this module
 *  can actually coerce cannot drift apart. */
export type RawAnswerValue = PlainValueInput;

/**
 * Whole numbers only — `Number.isInteger` on the PARSED value, not a
 * regex over the input's literal digits, so `"5.0"` (a string an LLM
 * might well emit) coerces to the integer `5` while `"5.5"` is rejected.
 * Rejects booleans outright (`Number(true) === 1` would otherwise let a
 * yes/no answer silently become a quantity) and empty/whitespace-only
 * strings (`Number("") === 0`, `Number("   ") === 0` — both real
 * JavaScript gotchas that would otherwise coerce "nothing typed" into the
 * number zero).
 */
export function coerceInteger(raw: RawAnswerValue): CoercionResult<number> {
  if (typeof raw === "boolean") {
    return fail(`"${raw}" is not a whole number`);
  }
  if (typeof raw === "string" && raw.trim() === "") {
    return fail(`"${raw}" is not a number`);
  }
  const value = typeof raw === "number" ? raw : Number(raw.trim());
  if (!Number.isFinite(value)) {
    return fail(`"${String(raw)}" is not a number`);
  }
  if (!Number.isInteger(value)) {
    return fail(`"${String(raw)}" is not a whole number`);
  }
  return ok(value);
}

/** Any finite number — no integrality requirement (a `decimal` question
 *  legitimately accepts `5.5`). Same boolean/empty-string guards as
 *  {@link coerceInteger}. */
export function coerceDecimal(raw: RawAnswerValue): CoercionResult<number> {
  if (typeof raw === "boolean") {
    return fail(`"${raw}" is not a number`);
  }
  if (typeof raw === "string" && raw.trim() === "") {
    return fail(`"${raw}" is not a number`);
  }
  const value = typeof raw === "number" ? raw : Number(raw.trim());
  if (!Number.isFinite(value)) {
    return fail(`"${String(raw)}" is not a number`);
  }
  return ok(value);
}

/** `Boolean("false")` is `true` — a silently wrong answer on a clinical
 *  form is exactly what this choke point exists to prevent, so strings
 *  are matched against the words a model actually emits and anything
 *  else is an error. */
export function coerceBoolean(raw: RawAnswerValue): CoercionResult<boolean> {
  if (typeof raw === "boolean") return ok(raw);
  if (typeof raw === "number") return ok(raw !== 0);
  const normalized = raw.trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return ok(true);
  if (["false", "no", "n", "0"].includes(normalized)) return ok(false);
  return fail(`"${raw}" is not a yes/no answer`);
}

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Strict local `YYYY-MM-DD`. Parsing avoids `Date.parse` because bare ISO
 * dates are UTC, uses `setFullYear` so two-digit years are not rewritten, and
 * round-trip checks catch invalid calendar days that `Date` normalizes.
 */
export function coerceLocalDate(raw: RawAnswerValue): CoercionResult<Date> {
  const text = String(raw).trim();
  const match = LOCAL_DATE_PATTERN.exec(text);
  if (!match) {
    return fail(`"${text}" is not a date in YYYY-MM-DD format`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  const roundTrips =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  if (!roundTrips) {
    return fail(`"${text}" is not a real calendar date`);
  }
  return ok(date);
}

/**
 * The inverse of {@link coerceLocalDate}: local date parts back to
 * `YYYY-MM-DD`, so accepted values round-trip through the assistant handle.
 * Kept dependency-free because this module is exercised outside Vite.
 */
export function formatLocalDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(:(\d{2})(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

/**
 * ISO 8601 datetime, e.g. `2024-06-15T14:30:00Z`. Unlike {@link
 * coerceLocalDate} this keeps whatever offset/`Z` the input carries (a
 * `dateTime` question's stored value is a real instant, not a local
 * calendar date) — but the CALENDAR DATE portion gets the identical
 * rollover check, via `setUTCFullYear` so a trailing offset never shifts
 * which day is being validated, before the value is handed to `new
 * Date(text)` for the actual instant.
 */
export function coerceDateTime(raw: RawAnswerValue): CoercionResult<Date> {
  const text = String(raw).trim();
  const match = DATE_TIME_PATTERN.exec(text);
  if (!match) {
    return fail(
      `"${text}" is not a valid dateTime (expected ISO 8601, e.g. 2024-06-15T14:30:00Z)`,
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(0);
  probe.setUTCHours(0, 0, 0, 0);
  probe.setUTCFullYear(year, month - 1, day);
  const roundTrips =
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day;
  if (!roundTrips) {
    return fail(`"${text}" is not a real calendar date`);
  }
  const value = new Date(text);
  if (Number.isNaN(value.getTime())) {
    return fail(`"${text}" is not a valid dateTime`);
  }
  return ok(value);
}

/** 24-hour "HH:mm", optionally with seconds — what `<input type="time">`
 *  (and therefore `TimeInput`) round-trips. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export function coerceTime(raw: RawAnswerValue): CoercionResult<string> {
  const text = String(raw).trim();
  if (!TIME_PATTERN.test(text)) {
    return fail(`"${text}" is not a time (expected 24-hour HH:mm)`);
  }
  return ok(text);
}

/** A choice option, matched by value or (case-insensitively) by value or
 *  display text. Returns the option's own `value` plus its `coding`, the
 *  same way `initializeResponses` seeds a pre-selected option. */
export interface ChoiceOptionLike {
  value: string;
  display?: string;
  code?: Code;
}

export function coerceChoiceOption(
  raw: RawAnswerValue,
  options: readonly ChoiceOptionLike[],
): CoercionResult<{ value: string; coding?: Code }> {
  const text = String(raw);
  const option =
    options.find((candidate) => candidate.value === text) ??
    options.find(
      (candidate) =>
        candidate.value.toLowerCase() === text.toLowerCase() ||
        candidate.display?.toLowerCase() === text.toLowerCase(),
    );
  if (!option) {
    return fail(
      `"${text}" is not one of: ${options.map((candidate) => candidate.value).join(", ")}`,
    );
  }
  return ok({ value: option.value, coding: option.code });
}

/** Input bounds every assistant write is checked against before any
 *  per-value coercion runs. Not schema validation of a single value —
 *  DoS-shaped hardening against an unbounded array/string from a looping
 *  or prompt-injected caller (a `repeats` question otherwise has no
 *  ceiling at all). */
export const MAX_RESPONSE_ENTRIES = 100;
export const MAX_RESPONSE_TEXT_LENGTH = 10_000;
export const MAX_NOTE_LENGTH = 10_000;

export type SetValueBoundsResult =
  { ok: true; values: RawAnswerValue[] } | { ok: false; error: string };

/** `NaN` is excluded here rather than at each numeric coercion: it is the
 *  one number no question type has a meaning for, and `String(NaN)` would
 *  otherwise reach a string question as the answer "NaN". */
function isRawAnswerValue(raw: unknown): raw is RawAnswerValue {
  if (typeof raw === "number") return Number.isFinite(raw);
  return typeof raw === "string" || typeof raw === "boolean";
}

/** Named without interpolating the value itself — a rejected entry may be
 *  an object whose `toString` is the caller's own code. */
function describeRejected(raw: unknown): string {
  if (raw === null) return "null";
  if (raw === undefined) return "undefined";
  if (Array.isArray(raw)) return "a list";
  if (typeof raw === "number") return "a non-finite number";
  return `a value of type ${typeof raw}`;
}

/**
 * Checked before per-entry coercion. Pure size/shape bounds only — never
 * question-type-aware (that is every `coerce*` function above).
 *
 * Entries are checked POSITIVELY against the scalar forms a `coerce*`
 * can act on, because a declared parameter type proves nothing about an
 * untrusted caller's argument: anything outside {@link PlainValueInput} —
 * `null` (what `getValue`/`listQuestions` hand BACK for an unanswered
 * repeat, hence the wider {@link PlainValueEntry} accepted here, so a
 * round-tripping caller is told rather than crashed), `undefined`, an
 * object, an array, a symbol, `NaN` — has no coercion at all. Rejecting
 * them here rather
 * than downstream is what keeps the handle from throwing a `TypeError`
 * out of `raw.trim()` or recording "null"/"[object Object]" as a clinical
 * answer. Clearing a question is `values: []`. The narrowed array comes
 * back on the success arm so the caller never has to cast.
 */
export function checkSetValueBounds(
  values: readonly PlainValueEntry[],
  note: string | undefined,
): SetValueBoundsResult {
  if (values.length > MAX_RESPONSE_ENTRIES) {
    return {
      ok: false,
      error: `Too many values (${values.length}); at most ${MAX_RESPONSE_ENTRIES} are accepted`,
    };
  }
  const raws: RawAnswerValue[] = [];
  for (const raw of values) {
    if (!isRawAnswerValue(raw)) {
      return {
        ok: false,
        error: `${describeRejected(raw)} is not an answer; pass a string, number or yes/no value, or an empty list of values to clear the question`,
      };
    }
    if (typeof raw === "string" && raw.length > MAX_RESPONSE_TEXT_LENGTH) {
      return {
        ok: false,
        error: `A value is too long (max ${MAX_RESPONSE_TEXT_LENGTH} characters)`,
      };
    }
    raws.push(raw);
  }
  if (note !== undefined && note.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: `Note is too long (max ${MAX_NOTE_LENGTH} characters)`,
    };
  }
  return { ok: true, values: raws };
}

/**
 * Top-level dispatch: one `RawAnswerValue` in, one `ResponseValue` out
 * (or a rejection), keyed on the question's declared type. Question
 * types with no unambiguous scalar form (`group`, `display`,
 * `structured`, `quantity`) are rejected rather than guessed at —
 * quantity's value+unit+coding shape is deliberately unsupported here.
 */
export function coercePlainResponseValue(
  question: Pick<
    Question,
    "type" | "link_id" | "answer_option" | "answer_value_set"
  >,
  raw: RawAnswerValue,
): CoercionResult<ResponseValue> {
  switch (question.type) {
    case "string":
    case "text":
    case "url":
      return ok({ type: "string", value: String(raw) });

    case "choice": {
      const options = question.answer_option;
      if (!options?.length) {
        // A value-set-backed choice renders through `ValueSetSelect`,
        // which reads `values[0].coding` — an uncoded string would show
        // the clinician an EMPTY field while `listQuestions` called it
        // answered and submit carried no code. Only a coded answer is a
        // real answer here, and this path has no parameter for one.
        if (question.answer_value_set) {
          return fail(
            `Question "${question.link_id}" requires a coded value from a value set; free text is not accepted`,
          );
        }
        return ok({ type: "string", value: String(raw) });
      }
      const coerced = coerceChoiceOption(raw, options);
      if (!coerced.ok) {
        return fail(`${coerced.error} (question "${question.link_id}")`);
      }
      return ok({
        type: "string",
        value: coerced.value.value,
        coding: coerced.value.coding,
      });
    }

    case "integer": {
      const result = coerceInteger(raw);
      if (!result.ok) {
        return fail(
          `${result.error} (question "${question.link_id}" is integer)`,
        );
      }
      return ok({ type: "number", value: result.value });
    }

    case "decimal": {
      const result = coerceDecimal(raw);
      if (!result.ok) {
        return fail(
          `${result.error} (question "${question.link_id}" is decimal)`,
        );
      }
      return ok({ type: "number", value: result.value });
    }

    case "boolean": {
      const result = coerceBoolean(raw);
      if (!result.ok) {
        return fail(`${result.error} (question "${question.link_id}")`);
      }
      return ok({ type: "boolean", value: result.value });
    }

    case "date": {
      const result = coerceLocalDate(raw);
      if (!result.ok) {
        return fail(`${result.error} (question "${question.link_id}")`);
      }
      return ok({ type: "date", value: result.value });
    }

    case "dateTime": {
      const result = coerceDateTime(raw);
      if (!result.ok) {
        return fail(`${result.error} (question "${question.link_id}")`);
      }
      return ok({ type: "dateTime", value: result.value });
    }

    case "time": {
      const result = coerceTime(raw);
      if (!result.ok) {
        return fail(`${result.error} (question "${question.link_id}")`);
      }
      return ok({ type: "time", value: result.value });
    }

    default:
      return fail(
        `Question "${question.link_id}" is of type ${question.type}, which the assistant cannot set`,
      );
  }
}
