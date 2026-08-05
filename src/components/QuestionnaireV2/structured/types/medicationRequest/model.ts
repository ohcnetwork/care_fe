import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import { listProjectValues } from "@/components/QuestionnaireV2/structured/shared/listProjectValues";
import {
  displayObjectSchema,
  isoInstantString,
  userDisplaySchema,
} from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import { sanitizeNote } from "@/components/QuestionnaireV2/structured/shared/sanitizeNote";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { CodeSchema, type Code } from "@/types/base/code/code";
import type {
  MedicationRequestCreate,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
  MedicationRequestTemplateSpec,
  TimingBoundsError,
} from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import type { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import type { UserReadMinimal } from "@/types/user/user";

/**
 * `getTimingBounds`/`validateTimingBounds`/`parseMedicationStringToRequest`
 * are implemented locally rather than value-imported because the source
 * module executes a top-level `@careConfig` chain via `@/Utils/decimal`, which
 * is not safe in the node test harness. Importing one named export still
 * executes the whole module, so these small pure helpers stay local.
 */
type TimingRepeat = NonNullable<
  MedicationRequestDosageInstruction["timing"]
>["repeat"];
type TimingBoundsLocal =
  | { type: "duration"; value: { value: string; unit: string } }
  | {
      type: "range";
      value: {
        low: { value: string; unit: string };
        high: { value: string; unit: string };
      };
    }
  | { type: "period"; value: { start?: string; end?: string } };

const LOCAL_UCUM_TIME_UNITS = ["d", "h", "wk", "mo", "a"] as const;

function localGetTimingBounds(
  repeat?: TimingRepeat,
): TimingBoundsLocal | undefined {
  if (repeat?.bounds_range)
    return { type: "range", value: repeat.bounds_range };
  if (repeat?.bounds_period)
    return { type: "period", value: repeat.bounds_period };
  if (repeat?.bounds_duration && repeat.bounds_duration.value !== "0") {
    return { type: "duration", value: repeat.bounds_duration };
  }
  return undefined;
}

function localValidateTimingBounds(
  bounds: TimingBoundsLocal,
): TimingBoundsError | null {
  switch (bounds.type) {
    case "duration": {
      const n = Number(bounds.value.value);
      const validUnit = (LOCAL_UCUM_TIME_UNITS as readonly string[]).includes(
        bounds.value.unit,
      );
      return Number.isInteger(n) && n > 0 && validUnit
        ? null
        : "invalid_duration";
    }
    case "range": {
      const low = Number(bounds.value.low.value);
      const high = Number(bounds.value.high.value);
      const ok =
        Number.isInteger(low) &&
        Number.isInteger(high) &&
        low > 0 &&
        high > 0 &&
        low <= high;
      return ok ? null : "invalid_day_range";
    }
    case "period": {
      const { start, end } = bounds.value;
      if (!start || !end) return "invalid_period_dates";
      return new Date(start).getTime() <= new Date(end).getTime()
        ? null
        : "invalid_period_dates";
    }
  }
}

/** `isPositive` re-implemented locally for the identical reason as above —
 *  `@/Utils/decimal` imports `@careConfig` at its own top level. Dosage
 *  values are plain decimal strings; a `Decimal` library is unneeded for a
 *  strictly-greater-than-zero check. */
function isPositiveDecimalString(value: string): boolean {
  if (value === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

/** Builds a fresh default `MedicationRequestCreate`, optionally seeded with
 *  a picked `Code` and/or `ProductKnowledgeBase`. Local copy for the
 *  `@careConfig` reason above. */
function freshMedicationRequestShell(
  requester: UserReadMinimal,
  medication?: Code,
  productKnowledge?: ProductKnowledgeBase,
): MedicationRequestCreate {
  const dosageInstruction: MedicationRequestDosageInstruction = {
    as_needed_boolean: false,
    ...(productKnowledge?.base_unit && {
      dose_and_rate: {
        type: "ordered",
        dose_quantity: { value: "1", unit: productKnowledge.base_unit },
      },
    }),
  };
  return {
    do_not_perform: false,
    dosage_instruction: [dosageInstruction],
    ...(medication ? { medication } : {}),
    ...(productKnowledge
      ? {
          requested_product: productKnowledge.id,
          requested_product_internal: productKnowledge,
        }
      : {}),
    status: "active",
    intent: "order",
    priority: "routine",
    category: "inpatient",
    authored_on: new Date().toISOString(),
    requester,
  };
}

/**
 * The wire shape is already the row shape — no widening needed. Dirtiness
 * is never stored on a row; it is derived from the edit log via
 * `resolveChanges`.
 */
export type MedicationRequestRow = MedicationRequestCreate;

// ---------------------------------------------------------------------------
// Assistant write guard. The enums below are hand-listed, not value-imported
// from `@/types/emr/medicationRequest/medicationRequest` — same hazard as
// the header comment above: a value import executes that module's top-level
// `@careConfig` chain and crashes `node --test`. `import type` stays safe.
// ---------------------------------------------------------------------------

const LOCAL_MEDICATION_REQUEST_STATUS = [
  "active",
  "on_hold",
  "draft",
  "unknown",
  "ended",
  "completed",
  "cancelled",
  "entered_in_error",
] as const;

const LOCAL_MEDICATION_REQUEST_STATUS_REASON = [
  "altchoice",
  "clarif",
  "drughigh",
  "hospadm",
  "labint",
  "non_avail",
  "preg",
  "salg",
  "sddi",
  "sdupther",
  "sintol",
  "surg",
  "washout",
] as const;

const LOCAL_MEDICATION_REQUEST_INTENT = [
  "proposal",
  "plan",
  "order",
  "original_order",
  "reflex_order",
  "filler_order",
  "instance_order",
] as const;

/** `MedicationRequest.category`'s own inline union — never given a runtime
 *  const array in the source module, so there is nothing "local" about
 *  this beyond restating the type's own four literals as values. */
const LOCAL_MEDICATION_CATEGORY = [
  "inpatient",
  "outpatient",
  "community",
  "discharge",
] as const;

/** Mirrors `MedicationPriority`'s own four values (that enum lives in the
 *  poisoned module — see this block's header comment). */
const LOCAL_MEDICATION_PRIORITY = [
  "stat",
  "urgent",
  "asap",
  "routine",
] as const;

/** Mirrors `MedicationRequestDispenseStatus`'s own three values (same
 *  reason). */
const LOCAL_MEDICATION_DISPENSE_STATUS = [
  "complete",
  "partial",
  "incomplete",
] as const;

const dosageQuantitySchema = z
  .object({ value: z.string(), unit: CodeSchema })
  .strict();
const doseRangeSchema = z
  .object({ low: dosageQuantitySchema, high: dosageQuantitySchema })
  .strict();
const boundsDurationSchema = z
  .object({ value: z.string(), unit: z.enum(LOCAL_UCUM_TIME_UNITS) })
  .strict();
const timingRangeSchema = z
  .object({ low: boundsDurationSchema, high: boundsDurationSchema })
  .strict();
/** A bare `{ start?; end? }`, deliberately NOT `periodSchema`: a timing
 *  bound's period is entered through `DurationInput`, so no specific
 *  string format is asserted here. */
const periodSpecSchema = z
  .object({ start: z.string().optional(), end: z.string().optional() })
  .strict();

const timingSchema = z
  .object({
    repeat: z
      .object({
        frequency: z.number(),
        period: z.string(),
        period_unit: z.enum(LOCAL_UCUM_TIME_UNITS),
        bounds_duration: boundsDurationSchema.optional(),
        bounds_range: timingRangeSchema.optional(),
        bounds_period: periodSpecSchema.optional(),
      })
      .strict(),
    code: CodeSchema.optional(),
  })
  .strict();

const dosageInstructionSchema = z
  .object({
    sequence: z.number().optional(),
    text: z.string().optional(),
    additional_instruction: z.array(CodeSchema).optional(),
    patient_instruction: z.string().optional(),
    timing: timingSchema.optional(),
    as_needed_boolean: z.boolean(),
    as_needed_for: CodeSchema.optional(),
    site: CodeSchema.optional(),
    route: CodeSchema.optional(),
    method: CodeSchema.optional(),
    dose_and_rate: z
      .object({
        type: z.enum(["ordered", "calculated"]),
        dose_quantity: dosageQuantitySchema.optional(),
        dose_range: doseRangeSchema.optional(),
      })
      .strict()
      .optional(),
    max_dose_per_period: doseRangeSchema.optional(),
  })
  .strict();

/**
 * `create_prescription` is `PrescriptionCreate` (`@/types/emr/prescription/
 * prescription`, a module that does NOT import `@/Utils/decimal` — safe to
 * value-import `PrescriptionStatus` from, and this file already does, just
 * above). `dirty` is DELIBERATELY absent from this shape: `.strict()`
 * means a patch still carrying the old `dirty` field is rejected, not silently
 * accepted and ignored.
 */
export const rowSchema = z
  .object({
    id: z.string().optional(),
    status: z.enum(LOCAL_MEDICATION_REQUEST_STATUS).optional(),
    status_reason: z.enum(LOCAL_MEDICATION_REQUEST_STATUS_REASON).optional(),
    intent: z.enum(LOCAL_MEDICATION_REQUEST_INTENT).optional(),
    category: z.enum(LOCAL_MEDICATION_CATEGORY).optional(),
    priority: z.enum(LOCAL_MEDICATION_PRIORITY).optional(),
    do_not_perform: z.boolean(),
    medication: CodeSchema.optional(),
    encounter: z.string().optional(),
    dosage_instruction: z.array(dosageInstructionSchema),
    note: z.string().optional(),
    authored_on: isoInstantString,
    created_by: userDisplaySchema.optional(),
    requested_product: z.string().optional(),
    requested_product_internal: displayObjectSchema(["slug"]).optional(),
    dispense_status: z.enum(LOCAL_MEDICATION_DISPENSE_STATUS).optional(),
    requester: userDisplaySchema,
    create_prescription: z
      .object({
        name: z.string().optional(),
        note: z.string().optional(),
        status: z.enum(["active", "completed", "cancelled"]),
        alternate_identifier: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict();

/**
 * Soft-delete contract: a baseline row (it has a server `id`) flips
 * `status` to `entered_in_error` and stays on screen; an added row that
 * never reached the server is simply dropped. `useStructuredRows`'s
 * `removeRow` dispatches on this descriptor.
 */
export const MEDICATION_REQUEST_SOFT_DELETE: SoftDeleteDescriptor<MedicationRequestRow> =
  {
    patch: { status: "entered_in_error" },
    isDeleted: (row) => row.status === "entered_in_error",
  };

/**
 * `MedicationRequestRead` (the server shape) → the row this question edits.
 * Pure so it is testable without a DOM.
 *
 * Fields are PICKED, never spread: the read shape carries audit and
 * expansion fields the row shape has no place for (`created_date`,
 * `modified_date`, `updated_by`, `prescription`,
 * `inventory_items_internal`). Spreading them would ride them into every
 * upsert datapoint and — because `rowSchema` is `.strict()` — make an
 * assistant patch echoing a baseline row unvalidatable.
 */
export function toMedicationRow(
  medication: MedicationRequestRead,
  currentUser: UserReadMinimal,
): MedicationRequestRow {
  return {
    id: medication.id,
    status: medication.status,
    status_reason: medication.status_reason,
    intent: medication.intent,
    category: medication.category,
    priority: medication.priority,
    do_not_perform: medication.do_not_perform,
    medication: medication.medication,
    encounter: medication.encounter,
    dosage_instruction: medication.dosage_instruction,
    note: medication.note,
    authored_on: medication.authored_on,
    created_by: medication.created_by,
    requested_product: medication.requested_product?.id,
    requested_product_internal: medication.requested_product,
    dispense_status: medication.dispense_status,
    requester: medication.requester || currentUser,
  };
}

/**
 * One baseline row per fetched medication request, keyed by the SERVER id.
 * Only called with a resolved `medicationRequestApi.list` result — the
 * loading/no-prescription states are handled by `useMedicationBaseline`.
 */
export function toBaselineRows(
  medications: readonly MedicationRequestRead[],
  currentUser: UserReadMinimal,
): BaselineRow<MedicationRequestRow>[] {
  return medications.map((medication) => ({
    rowId: medication.id,
    row: toMedicationRow(medication, currentUser),
  }));
}

/** An empty `create_prescription` shell; the real `alternate_identifier`
 *  is stamped per-submission by `toRequests`. */
function draftPrescription(): MedicationRequestCreate["create_prescription"] {
  return {
    status: PrescriptionStatus.active,
    alternate_identifier: "",
  };
}

/** A fresh row from a picked medication code (the plain ValueSet path — no
 *  product knowledge). */
export function newMedicationRowFromCode(
  code: Code,
  currentUser: UserReadMinimal,
): MedicationRequestRow {
  return {
    ...freshMedicationRequestShell(currentUser, code),
    create_prescription: draftPrescription(),
  };
}

/**
 * A fresh row from a picked product-knowledge item. A `consumable` product
 * overrides its single dosage instruction to PRN — a consumable is
 * dispensed on demand rather than scheduled.
 */
export function newMedicationRowFromProduct(
  product: ProductKnowledgeBase,
  currentUser: UserReadMinimal,
): MedicationRequestRow {
  const base = freshMedicationRequestShell(currentUser, undefined, product);
  const [firstInstruction, ...rest] = base.dosage_instruction;
  const dosageInstruction: MedicationRequestDosageInstruction[] =
    product.product_type === "consumable"
      ? [
          { ...firstInstruction, as_needed_boolean: true, timing: undefined },
          ...rest,
        ]
      : base.dosage_instruction;
  return {
    ...base,
    dosage_instruction: dosageInstruction,
    create_prescription: draftPrescription(),
  };
}

// ---------------------------------------------------------------------------
// Response templates — the `useAddToTemplate`/`applyTemplateItems` contract
// ---------------------------------------------------------------------------

/**
 * A row → the plain data a template stores.
 *
 * `authored_on`: the backend's template-create serializer REQUIRES it even
 * though `MedicationRequestTemplateSpec` omits it, so the return type is
 * widened by exactly that field rather than hidden behind a cast. The value
 * is never read back — {@link medicationRowFromTemplate} always stamps a
 * fresh one; it exists only to satisfy the required-field check.
 *
 * Product vs. code: a product-based medication stores its product's SLUG
 * (a template must stay resolvable against product knowledge indefinitely,
 * not via a UUID tied to one prior request) and omits `medication`; a
 * code-based one keeps `medication` and omits `requested_product` — never
 * both.
 */
export function buildMedicationRequestForTemplate(
  row: MedicationRequestRow,
): MedicationRequestTemplateSpec & { authored_on: string } {
  return {
    status: row.status,
    status_reason: row.status_reason,
    intent: row.intent,
    category: row.category,
    priority: row.priority,
    do_not_perform: row.do_not_perform,
    dosage_instruction: row.dosage_instruction,
    note: row.note,
    // Backend-required (see doc comment above) — NOT read back by
    // `medicationRowFromTemplate`, which always stamps a fresh one.
    authored_on: row.authored_on,
    ...(row.requested_product_internal
      ? { requested_product: row.requested_product_internal.slug }
      : row.medication?.code
        ? { medication: row.medication }
        : {}),
  };
}

/**
 * The inverse of {@link buildMedicationRequestForTemplate}: stored template
 * data plus product knowledge fetched by slug becomes a fresh row.
 * `authored_on`, `requester`, and `create_prescription` are reset so applied
 * templates follow the same prescription-note path as directly picked
 * medications.
 */
export function medicationRowFromTemplate(
  templateMedication: MedicationRequestTemplateSpec,
  productKnowledge: ProductKnowledgeBase | undefined,
  currentUser: UserReadMinimal,
): MedicationRequestRow {
  return {
    ...templateMedication,
    do_not_perform: templateMedication.do_not_perform ?? false,
    dosage_instruction: templateMedication.dosage_instruction?.length
      ? templateMedication.dosage_instruction
      : [{ as_needed_boolean: false }],
    authored_on: new Date().toISOString(),
    requester: currentUser,
    requested_product: productKnowledge?.id,
    requested_product_internal: productKnowledge,
    create_prescription: draftPrescription(),
  };
}

/** A list, not a singleton: a row here is born whole the moment
 *  `newMedicationRowFrom{Code,Product}` creates it (see
 *  {@link listProjectValues}). */
export const projectValues: ProjectValues<MedicationRequestRow> =
  listProjectValues("medication_request");

/**
 * The edit log → at most one POST against the upsert endpoint, carrying
 * every medication this session touched. An empty edit log produces no
 * request.
 *
 * PRESCRIPTION IDENTITY: every row without a server id gets the same
 * `alternate_identifier`, generated once per call — new medications saved
 * together are grouped under ONE new prescription. Existing rows carry no
 * `create_prescription`.
 *
 * PRESCRIPTION NOTE: the editor can only write the note onto ONE row (two
 * mutator calls in one handler would clobber each other), so it writes it
 * to the first added row; here it is fanned out to EVERY new row's
 * `create_prescription`. Which datapoint the server reads the note from is
 * then not a question of ordering.
 *
 * The whole row is spread into the wire body first, then the fields the
 * server expects in a different shape are overridden.
 */
export async function toRequests(
  edits: readonly StructuredEdit<MedicationRequestRow>[],
  { patientId, encounterId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!patientId) return [];
  const { creates, updates, removes } = resolveChanges(edits, {
    softDelete: MEDICATION_REQUEST_SOFT_DELETE,
  });
  const rows = [
    ...creates,
    ...updates,
    ...removes.flatMap((entry) => (entry.row ? [entry.row] : [])),
  ];
  if (rows.length === 0) return [];

  const prescriptionIdentifier = `${encounterId}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const prescriptionNote = rows.find(
    (row) => !row.id && row.create_prescription?.note,
  )?.create_prescription?.note;

  return [
    {
      url: `/api/v1/patient/${patientId}/medication/request/upsert/`,
      method: "POST",
      body: {
        datapoints: rows.map((row) => ({
          ...row,
          ...(!row.id && {
            create_prescription: {
              ...row.create_prescription,
              note: prescriptionNote,
              status: PrescriptionStatus.active,
              alternate_identifier: prescriptionIdentifier,
            },
          }),
          note: sanitizeNote(row.note),
          encounter: encounterId,
          patient: patientId,
          requester: row.requester?.id,
        })),
      },
      reference_id: structuredReferenceId("medication_request", questionId),
    },
  ];
}

// ---------------------------------------------------------------------------
// Validation — the per-dosage-instruction nested predicate
// ---------------------------------------------------------------------------

/** One invalid slot within one medication's dosage instructions. `fieldKey`
 *  matches the wire convention (`dosage_instruction[i].dose`, and so on) so a
 *  server-side validation error keyed the same way binds to the same cell. */
export interface MedicationRowFieldError {
  rowId: string;
  fieldKey: string;
  /** `"duration"` carries a specific "why it's invalid" reason
   *  (`TimingBoundsError`); every other kind reads as a plain required error. */
  kind: "required" | "duration";
  durationError?: TimingBoundsError;
}

function hasValidDose(
  instruction: MedicationRequestDosageInstruction,
): boolean {
  const doseAndRate = instruction.dose_and_rate;
  const doseQuantityValue = doseAndRate?.dose_quantity?.value;
  if (doseQuantityValue != null)
    return isPositiveDecimalString(doseQuantityValue);
  const doseRange = doseAndRate?.dose_range;
  if (doseRange) {
    return (
      isPositiveDecimalString(doseRange.low?.value ?? "0") &&
      isPositiveDecimalString(doseRange.high?.value ?? "0")
    );
  }
  return false;
}

/**
 * A real frequency carries an explicit FHIR timing code, an as-needed flag,
 * or a free-text M-A-N pattern. A bare `timing` is not enough — setting a
 * duration alone auto-creates a repeat with `frequency` set to `1` and no code/text,
 * which must not satisfy this.
 */
function hasValidFrequency(
  instruction: MedicationRequestDosageInstruction,
): boolean {
  return !!(
    instruction.as_needed_boolean ||
    instruction.text ||
    instruction.timing?.code
  );
}

/** Duration is optional — only the CONTENTS of a bound that was actually set
 *  are validated (range low <= high, period start <= end, ...). Returns the
 *  `TimingBoundsError` i18n key, or `null` when there is nothing set or what
 *  is set is valid. */
function invalidDurationError(
  instruction: MedicationRequestDosageInstruction,
): TimingBoundsError | null {
  const bounds = localGetTimingBounds(instruction.timing?.repeat);
  return bounds ? localValidateTimingBounds(bounds) : null;
}

/**
 * For every edited (non-removed, non-`entered_in_error`) medication, checks
 * each dosage instruction's dose/frequency/duration, producing one
 * `MedicationRowFieldError` per invalid slot, index-suffixed to match the
 * server's `field_key` convention.
 *
 * Validates `edits`, not the projection: a row-scoped error needs a `rowId`,
 * which only an edit carries. An untouched baseline medication was already
 * valid on the server and never blocks Save. `remove` ops and
 * `entered_in_error` patches are skipped — a row on its way out must not
 * trip validation.
 */
export function invalidDosageFieldErrors(
  edits: readonly StructuredEdit<MedicationRequestRow>[],
): MedicationRowFieldError[] {
  const errors: MedicationRowFieldError[] = [];
  for (const edit of edits) {
    if (edit.op === "remove") continue;
    const row = edit.patch;
    if (row.status === "entered_in_error") continue;

    if (!row.dosage_instruction.length) {
      errors.push({
        rowId: edit.rowId,
        fieldKey: "dosage_instruction",
        kind: "required",
      });
      continue;
    }

    row.dosage_instruction.forEach((instruction, index) => {
      const keyPrefix = `dosage_instruction[${index}]`;
      if (!hasValidDose(instruction)) {
        errors.push({
          rowId: edit.rowId,
          fieldKey: `${keyPrefix}.dose`,
          kind: "required",
        });
      }
      if (!hasValidFrequency(instruction)) {
        errors.push({
          rowId: edit.rowId,
          fieldKey: `${keyPrefix}.frequency`,
          kind: "required",
        });
      }
      const durationError = invalidDurationError(instruction);
      if (durationError) {
        errors.push({
          rowId: edit.rowId,
          fieldKey: `${keyPrefix}.duration`,
          kind: "duration",
          durationError,
        });
      }
    });
  }
  return errors;
}

/** The largest number of dosage instructions across the CURRENT rows, or 1
 *  when there are none yet — sizes the dose/frequency/duration columns'
 *  `errorFieldKeys` so every currently-possible index has a slot a server
 *  or client error can bind to. Recomputed whenever `rows` changes (adding
 *  an instruction on any row grows this on the very same render). */
export function maxDosageInstructionCount(
  rows: readonly { row: MedicationRequestRow }[],
): number {
  return Math.max(
    1,
    ...rows.map((entry) => entry.row.dosage_instruction.length || 1),
  );
}

/** `dosage_instruction[0..count).${suffix}` — the static `errorFieldKeys`
 *  list a dose/frequency/duration column declares. */
export function dosageInstructionFieldKeys(
  count: number,
  suffix: "dose" | "frequency" | "duration",
): string[] {
  return Array.from(
    { length: count },
    (_, index) => `dosage_instruction[${index}].${suffix}`,
  );
}
