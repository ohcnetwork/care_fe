import { z } from "zod";

/**
 * Shared `rowSchema` building blocks. Keep this dependency-free for unit tests,
 * and use strict schemas so unknown externally authored fields are rejected.
 * Date-only validation round-trips parsed components to reject impossible
 * calendar dates like "2024-02-31".
 */

/** A real calendar date, strictly `YYYY-MM-DD` — matches every onset/last-
 *  occurrence/authored-on-date field across the ported types. Rejects
 *  `"2024-02-31"` (not a real day), a 2-digit year, and any non-ISO
 *  separator/format, not just a malformed shape. */
export const dateOnlyString = z.string().refine(
  (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const [, y, m, d] = match;
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  },
  { message: "must be a real calendar date in YYYY-MM-DD format" },
);

/** A timezone-aware instant — anything `new Date(...)` parses to a real
 *  time (rejects `""`, whitespace, and any string `Date.parse` cannot
 *  resolve). Deliberately looser than {@link dateOnlyString}: every
 *  consumer of this (`authored_on`, `effective_period.start/end`,
 *  `deceased_datetime`) stores a full ISO instant produced by a picker
 *  (`Date.toISOString()`/`DateTimeInput`), not a hand-typed date-only
 *  string, so the rollover hazard `dateOnlyString` guards against does not
 *  apply the same way here — there is no "day 31 of a 30-day month"
 *  ambiguity in a full timestamp the way there is in a bare calendar date. */
export const isoInstantString = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "must be a valid date-time string",
  });

/** A non-blank string — `z.string().min(1)` named for what it guards
 *  against (an assistant patch setting a required text field to `""`),
 *  reused across every type whose row has a required free-text/id field. */
export const nonEmptyString = z.string().min(1);

/**
 * Display objects carried alongside submitted ids are deliberately loose:
 * they are large read shapes copied from prior lookups, not authored field by
 * field. `id` and any call-site required string keys are validated; all other
 * fields are allowed without duplicating full read schemas.
 */
export function displayObjectSchema(
  extraRequiredStringKeys: readonly string[] = [],
) {
  const shape: Record<string, z.ZodType> = { id: nonEmptyString };
  for (const key of extraRequiredStringKeys) shape[key] = nonEmptyString;
  return z.object(shape).loose();
}

/** `UserReadMinimal` as it appears embedded in a row (`requester`,
 *  `performer_actor_object`) — see {@link displayObjectSchema}'s own doc
 *  comment for why this is `.loose()`, not a `.strict()`, shape. */
export const userDisplaySchema = displayObjectSchema(["username"]);

/**
 * `symptom`'s and `diagnosis`'s `Onset` — two separately DECLARED TS types
 * (each `model.ts` has its own `type Onset = {...}`), but structurally
 * identical, and both types' `toSymptomRow`/`toDiagnosisRow` format
 * `onset_datetime` the same bare `"yyyy-MM-dd"` way (`date-fns`'s `format`,
 * never a full ISO instant) — so one shared, `.strict()` schema covers both
 * without either `model.ts` importing the other's type.
 */
export const onsetSchema = z
  .object({
    onset_datetime: dateOnlyString.optional(),
    onset_age: z.string().optional(),
    onset_string: z.string().optional(),
    note: z.string().optional(),
  })
  .strict();

/**
 * `Period` — declared separately (but identically: `{ start?: string; end?:
 * string }`) in `@/types/questionnaire/base` (medication_statement) and
 * `@/types/emr/encounter/encounter` (encounter). Both fields are validated
 * as {@link isoInstantString} (optional): `medicationStatement/model.ts`'s
 * own `periodDateFromInput` doc comment documents, from a LIVE mount test,
 * that the backend's period validator rejects a bare date-only string and
 * requires a timezone-aware instant — the exact shape this schema checks
 * for, not merely assumes.
 */
export const periodSchema = z
  .object({
    start: isoInstantString.optional(),
    end: isoInstantString.optional(),
  })
  .strict();
