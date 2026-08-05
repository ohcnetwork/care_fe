import { z } from "zod";

/**
 * Shared building blocks for every ported type's `rowSchema` (spec §6 A2 —
 * `fill/assistant/structuredEditValidation.ts`'s `rowSchemaOf` contract: a
 * type publishes a zod row schema from its own `model.ts`, `.strict()` so
 * unknown fields are rejected, not silently stripped).
 *
 * Dependency-free by the SAME rule every `model.ts` in this directory
 * already follows (see `medicationRequest/model.ts`'s and
 * `serviceRequest/model.ts`'s own doc comments): no `@careConfig`-touching
 * import, directly or transitively, because `npm run test:unit` is plain
 * `node --import tsx --test`, not Vite — `import.meta.env` is `undefined`
 * there. `zod` itself has no such dependency (confirmed: `@/types/base/
 * code/code.ts` already imports it at module scope for `CodeSchema`, and
 * that module is imported by plenty of `node --test`-covered code today).
 *
 * NOT a re-implementation of `fill/assistant/coercion.ts`'s date coercion —
 * deliberately. That module coerces a PLAIN ANSWER's raw string into a
 * `ResponseValue` for a non-structured question; this module validates a
 * STRUCTURED ROW field that already carries a string in the row's own
 * shape. Sharing logic across the two would reach into `fill/*`, out of
 * this task's territory. The round-trip rigor (build a `Date` from the
 * parsed components, read it back, and require an exact match — never the
 * `Date` CONSTRUCTOR's own two-digit-year rewrite or its habit of
 * normalizing an out-of-range day into the next month) is intentionally the
 * same shape as that module's, because the underlying hazard (`new
 * Date("2024-02-31")` silently becoming March 2) is identical wherever a
 * calendar date string is accepted from outside the type's own UI.
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
 * A DISPLAY object a row carries alongside the id it actually submits —
 * `UserReadMinimal` (`requester`/`performer_actor_object`), a picked
 * definition (`charge_item_definition_object`/`activity_definition_object`),
 * a product (`requested_product_internal`). Deliberately `.loose()`,
 * not `.strict()`, and this is the one documented exception to the
 * "unknown fields rejected" rule every OTHER field in every `rowSchema`
 * follows: these are large, purely-informational READ shapes (tens of
 * optional fields across nested billing/category/tag types) an assistant
 * would only ever COPY VERBATIM from a prior lookup the host already
 * performed, never author field-by-field from a voice command. Requiring
 * exact strictness here would force this schema to duplicate the FULL
 * shape of `UserReadMinimal`/`ChargeItemDefinitionRead`/
 * `ActivityDefinitionReadSpec` (none of them "shapes worth an assistant
 * hand-typing") for a security property (typo/hallucination rejection)
 * that only matters for fields an author actually TYPES. `id` is required
 * because every real consumer of these objects keys off it (equality
 * checks, the `UserSelector`/definition pickers); the rest of
 * `requiredStringKeys` names whatever ELSE this call site's own row-level
 * code actually reads off the object directly (e.g. a definition's
 * `slug`/`title`) — everything not named is only checked for PRESENCE via
 * `.loose()`, never for an exhaustive key list.
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
