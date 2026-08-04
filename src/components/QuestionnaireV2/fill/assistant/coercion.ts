import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

/**
 * The one choke point every assistant write to a PLAIN (non-structured)
 * question passes through. Deliberately dependency-free (no React, no
 * `@careConfig`-touching utils, no zod) so `node --test` can exercise it
 * directly — see `coercion.test.ts`. `Question`/`ResponseValue` are
 * `import type` only, so this stays true even though those modules live
 * under `@/types/questionnaire/*` — type-only imports are erased before
 * `tsx` ever resolves a runtime module for them.
 *
 * FIXES P1-19. The registry this replaces (`fill/useFillActions.ts`'s old
 * `coerceResponseValue`) had two bugs:
 *
 *  1. `integer`/`decimal` shared one branch: `Number(raw)` with only a
 *     `NaN` check — `"5.5"` silently became the number `5.5` for a
 *     question the questionnaire declares `integer`. Fixed here by giving
 *     `integer` its own `Number.isInteger` gate ({@link coerceInteger});
 *     `decimal` keeps accepting any finite value ({@link coerceDecimal}).
 *  2. `date`/`dateTime` used `new Date(String(raw))`. For a bare
 *     `"YYYY-MM-DD"` string that is UTC-midnight parsing (ECMA-262's Date
 *     Time String Format) — every timezone west of UTC reads back the
 *     PREVIOUS calendar day. And `new Date("2024-02-31")` does not throw:
 *     `MakeDay` normalizes the overflow to March 2 instead of rejecting a
 *     date that was never real. Fixed here by {@link coerceLocalDate}:
 *     strict `^\d{4}-\d{2}-\d{2}$`, components built with
 *     `Date.prototype.setFullYear` (never the constructor — see that
 *     function's own doc comment for why the constructor's legacy
 *     two-digit-year special case matters here), and a round-trip check
 *     (`getFullYear`/`getMonth`/`getDate` must echo the parsed components
 *     back exactly) that catches the rollover the old code accepted.
 */

export type CoercionResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

function ok<T>(value: T): CoercionResult<T> {
  return { ok: true, value };
}

function fail<T>(error: string): CoercionResult<T> {
  return { ok: false, error };
}

/** What an assistant may supply as one repeat's raw input — the same
 *  primitive union the old `SetResponseInput.values` accepted. */
export type RawAnswerValue = string | number | boolean;

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
 *  else is an error. Ported unchanged from the old registry (not a
 *  P1-19 finding). */
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
 * Strict `YYYY-MM-DD`, parsed as a LOCAL date (midnight, the clinician's
 * own timezone) — never through the `Date` constructor or `Date.parse`,
 * both of which treat a bare date-only ISO string as UTC. Built with
 * `setFullYear(year, month, day)` rather than `new Date(year, month,
 * day)`: the constructor (and `setYear`) special-case a two-digit year
 * (`0`–`99`) as `1900 + year` — a real hazard here since the regex admits
 * any four digits, including `"0099"` — while `setFullYear`'s three-
 * argument form sets the literal year with no such rewriting.
 *
 * Round-trip validated: the constructed date's own `getFullYear`/
 * `getMonth`/`getDate` must echo the parsed components back exactly.
 * `Date`'s day-of-month arithmetic normalizes an out-of-range day rather
 * than rejecting it (`2024-02-31` silently becomes March 2), so this is
 * what actually catches a rollover instead of just parsing further into
 * the eventual (wrong) `Date` the old code produced.
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
 * The exact inverse of {@link coerceLocalDate}: local `getFullYear`/
 * `getMonth`/`getDate` back to `YYYY-MM-DD`, so a value this module
 * accepted round-trips through `getValue`/`listQuestions`'s "current
 * projection" unchanged. Deliberately NOT `@/Utils/utils`'s
 * `dateQueryString` (a `dayjs` wrapper that would give the identical
 * answer): that module imports `@careConfig` at its top, which reads
 * `import.meta.env` and is `undefined` outside Vite — the same hazard
 * `structured/types/files/model.ts` documents — and this file is
 * `node --test`-exercised directly (`coercion.test.ts`), no Vite in sight.
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
 *  (and therefore `TimeInput`) round-trips. Ported unchanged. */
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
  code?: unknown;
}

export function coerceChoiceOption(
  raw: RawAnswerValue,
  options: readonly ChoiceOptionLike[],
): CoercionResult<{ value: string; coding?: unknown }> {
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
 *  per-value coercion runs — ported unchanged from the old registry's
 *  `setResponseSchema`. Not schema validation of a single value; this is
 *  DoS-shaped hardening against an unbounded array/string from a looping
 *  or prompt-injected caller (`applySetResponse`'s only prior check was
 *  `values.length > 1 && !question.repeats`, which a `repeats` question
 *  had no ceiling on at all). */
export const MAX_RESPONSE_ENTRIES = 100;
export const MAX_RESPONSE_TEXT_LENGTH = 10_000;
export const MAX_NOTE_LENGTH = 10_000;

export interface SetValueBoundsResult {
  ok: boolean;
  error?: string;
}

/** Checked before per-entry coercion. Pure size/shape bounds only — never
 *  question-type-aware (that is every `coerce*` function above). */
export function checkSetValueBounds(
  values: readonly RawAnswerValue[],
  note: string | undefined,
): SetValueBoundsResult {
  if (values.length > MAX_RESPONSE_ENTRIES) {
    return {
      ok: false,
      error: `Too many values (${values.length}); at most ${MAX_RESPONSE_ENTRIES} are accepted`,
    };
  }
  for (const raw of values) {
    if (typeof raw === "string" && raw.length > MAX_RESPONSE_TEXT_LENGTH) {
      return {
        ok: false,
        error: `A value is too long (max ${MAX_RESPONSE_TEXT_LENGTH} characters)`,
      };
    }
  }
  if (note !== undefined && note.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: `Note is too long (max ${MAX_NOTE_LENGTH} characters)`,
    };
  }
  return { ok: true };
}

/**
 * The top-level dispatch: one `RawAnswerValue` in, one `ResponseValue` out
 * (or a rejection), keyed on the question's declared type — the same
 * shape as the old registry's `coerceResponseValue`, rebuilt on the fixed
 * primitives above. Question types with no unambiguous scalar form
 * (`group`, `display`, `structured`, `quantity`) are rejected rather than
 * guessed at, matching the old code's scope exactly (quantity's
 * value+unit+coding shape is a deliberate carry-forward gap, not new).
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
        coding: coerced.value.coding as ResponseValue["coding"],
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
