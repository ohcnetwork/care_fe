import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type {
  BaselineRow,
  ProjectValues,
  SoftDeleteDescriptor,
} from "@/components/QuestionnaireV2/structured/core/types";
import {
  displayObjectSchema,
  isoInstantString,
  userDisplaySchema,
} from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
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
 * are re-implemented locally rather than imported as VALUES from
 * `@/types/emr/medicationRequest/medicationRequest` — that module also
 * defines `computeTotalDoseQuantity` et al., which import `@/Utils/decimal`,
 * which imports `@careConfig` at its own top level and reads
 * `import.meta.env` there — `undefined` under `node --test`, the identical
 * hazard `diagnosis/model.ts`'s own doc comment documents for
 * `@/Utils/utils`. Importing a SINGLE named export from a module still
 * executes the WHOLE module's top-level code (ES modules have no
 * per-export laziness), so there is no way to cherry-pick just these three
 * functions from that file without poisoning this one for the test
 * harness. All three are copied here as small, self-contained pure
 * functions with no Decimal dependency of their own — only the (harmless)
 * duplication is new; the app's real `DurationInput.tsx`/legacy widget keep
 * using the original copies unmodified, since neither is ever loaded by
 * `node:test`.
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

/** A fresh `MedicationRequest` shell — the ACTUAL behavior of
 *  `parseMedicationStringToRequest` (a misleading name: despite the
 *  docstring, it never parses a string; it builds a default request,
 *  optionally seeded with a picked `Code` and/or `ProductKnowledgeBase`).
 *  Re-implemented locally for the `@careConfig` reason above. */
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
 * The wire shape is already the row shape — no widening needed, matching
 * `diagnosis`/`allergy_intolerance`. `dirty` (still `dirty?: boolean` on
 * `MedicationRequestCreate` — see that type's own doc comment) is the ONE
 * field a v2 row is allowed to carry but must NEVER set: every function
 * below omits it entirely. Dirtiness is derived from the edit log
 * (`resolveChanges`, below) — the legacy widget's hand-maintained flag dies
 * with it in the Phase 5 closeout, alongside the legacy widget that still
 * writes it.
 */
export type MedicationRequestRow = MedicationRequestCreate;

// ---------------------------------------------------------------------------
// The assistant write guard (spec §6 A2) — see `timeOfDeath/model.ts`'s
// `rowSchema` for the full contract this fulfills the same way.
//
// Every enum below is HAND-LISTED rather than imported from
// `@/types/emr/medicationRequest/medicationRequest` as a value — mirrors
// this file's own `LOCAL_UCUM_TIME_UNITS` above and its doc comment's exact
// reasoning: that module imports `@/Utils/decimal` (→ `@careConfig` →
// `import.meta.env`, `undefined` under `node --test`) at ITS OWN module
// scope, so importing even one unrelated named VALUE from it — not just
// the specific function that needs Decimal — re-executes that whole
// import chain and crashes the harness before a single assertion runs.
// `import type` is unaffected (erased before `tsx` resolves anything), so
// every TYPE this file already imports from there stays untouched; only
// enum/const-array VALUES needed new, local copies.
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
/** `PeriodSpec` — a bare `{ start?; end? }`, NOT {@link periodSchema}
 *  (`rowSchemaPrimitives.ts`): a timing bound's period is entered through
 *  `DurationInput`, not verified live against the backend's timezone-aware
 *  requirement the way `medicationStatement`'s `effective_period` was —
 *  left as plain optional strings rather than asserting a format this port
 *  never confirmed. */
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
 * means an assistant patch still carrying the legacy field (a stale/copied
 * baseline row) is REJECTED, not silently accepted-and-ignored — matching
 * `diagnosis/model.ts`'s identical choice for its own retired `dirty` flag.
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
 * The soft-delete contract — P1-14's other half. Legacy split this by hand
 * at `confirmRemoveMedication`: a row WITH a server `id` flips `status` to
 * `entered_in_error` and stays on screen; a row WITHOUT one (never reached
 * the server) is simply dropped. `useStructuredRows`'s `removeRow` already
 * implements exactly this dispatch for any type that supplies a
 * `SoftDeleteDescriptor` — configuring this descriptor is the whole fix,
 * mirroring `allergyIntolerance/model.ts`'s `ALLERGY_SOFT_DELETE`.
 */
export const MEDICATION_REQUEST_SOFT_DELETE: SoftDeleteDescriptor<MedicationRequestRow> =
  {
    patch: { status: "entered_in_error" },
    isDeleted: (row) => row.status === "entered_in_error",
  };

/**
 * `MedicationRequestRead` (the server shape) → the row this question edits.
 * Exactly `MedicationRequestQuestion.tsx`'s prescription-scoped effect
 * (`:387-405`), lifted out so it is testable without a DOM and so it never
 * writes `dirty` (the legacy effect wrote `dirty: false`; this omits the
 * key entirely).
 */
export function toMedicationRow(
  medication: MedicationRequestRead,
  currentUser: UserReadMinimal,
): MedicationRequestRow {
  const { requested_product, ...rest } = medication;
  return {
    ...rest,
    requested_product: requested_product?.id,
    requested_product_internal: requested_product,
    requester: medication.requester || currentUser,
  };
}

/**
 * One baseline row per fetched medication request, keyed by the SERVER id.
 *
 * BASELINE HONESTY (BASELINE COMPLETENESS CONTRACT). Only ever called with a
 * RESOLVED `medicationRequestApi.list` result for the `?prescription=`-scoped
 * case — see `MedicationRequestEditor.tsx`'s `useMedicationBaseline` for the
 * full three-state contract (undefined while loading, `[]` when this
 * question has no prescription to scope to at all, the real rows once
 * resolved).
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

/** A single, PRN-off dosage instruction shell — every fresh medication
 *  starts with exactly one, exactly like `parseMedicationStringToRequest`'s
 *  own default. */
function draftPrescription(): MedicationRequestCreate["create_prescription"] {
  return {
    status: PrescriptionStatus.active,
    alternate_identifier: "",
  };
}

/**
 * A freshly picked medication code (the plain ValueSet path — no product
 * knowledge). Mirrors `MedicationRequestQuestion.tsx`'s `handleAddMedication`.
 */
export function newMedicationRowFromCode(
  code: Code,
  currentUser: UserReadMinimal,
): MedicationRequestRow {
  return {
    ...freshMedicationRequestShell(currentUser, code),
    authored_on: new Date().toISOString(),
    requester: currentUser,
    create_prescription: draftPrescription(),
  };
}

/**
 * A freshly picked product-knowledge item. Mirrors
 * `MedicationRequestQuestion.tsx`'s `handleAddProductMedication`: a
 * `consumable` product overrides its (only) dosage instruction to PRN,
 * since a consumable is dispensed on demand rather than scheduled.
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
    authored_on: new Date().toISOString(),
    requester: currentUser,
    create_prescription: draftPrescription(),
  };
}

function sanitizeNote(note: string | undefined): string | undefined {
  return note?.trim() || undefined;
}

// ---------------------------------------------------------------------------
// Response templates — the `useAddToTemplate`/`applyTemplateItems` contract
// ---------------------------------------------------------------------------

/**
 * A row → the plain data a template stores, mirroring `service_request`'s
 * own `buildServiceRequestForTemplate` (`structured/types/serviceRequest/
 * model.ts`) — a clean, EXPLICIT object built field by field, not the
 * legacy `buildMedicationForTemplate`'s spread-then-delete
 * `Record<string, unknown>` (`QuestionTypes/MedicationRequestQuestion.tsx`).
 *
 * FOUND BY MOUNT-TESTING (not assumed), the identical class of gap
 * `service_request`'s own port found in `activityDefinitionPrice`: the
 * declared TS type `MedicationRequestTemplateSpec` (`@/types/emr/
 * medicationRequest/medicationRequest`) OMITS `authored_on` — but the
 * backend's template-create serializer REJECTS a `template_data.
 * medication_request[N]` entry that doesn't carry one ("Field required:
 * ...medication_request.0.authored_on"), confirmed live against the real
 * `POST /api/v1/questionnaire_response_template/`. Legacy's own
 * `buildMedicationForTemplate` never tripped this because it spread the
 * WHOLE row (`{...medication, ...}`), which always carried the row's real
 * `authored_on` along for the ride despite the same TS type omitting it
 * there too — so this is a pre-existing backend requirement the old code
 * satisfied by accident, not a new one this port introduces. Rather than
 * write to a `MedicationRequestTemplateSpec` shape known to be short one
 * required wire field, this widens the return type by exactly that one
 * field (`& { authored_on: string }`) so the gap is visible in the type,
 * not hidden behind a cast. The value stored is dead data from the
 * template's own perspective — {@link medicationRowFromTemplate} always
 * resets `authored_on` to the applying moment, never reads it back — it
 * exists purely to satisfy the backend's required-field check.
 *
 * PRODUCT VS. CODE, exactly legacy's own branch: a product-based medication
 * stores its PRODUCT'S SLUG (not this specific request's product id or
 * `id` — a template must stay resolvable against product knowledge by slug
 * indefinitely, not a UUID tied to one prior request) in `requested_product`
 * and omits `medication`; a code-based medication keeps `medication` and
 * omits `requested_product` entirely — never both, never neither (unless
 * the row itself has neither, which the UI cannot currently produce).
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
 * The inverse of {@link buildMedicationRequestForTemplate} — a template's
 * stored spec plus the product knowledge fetched by its stored SLUG (a
 * template only ever stores the slug; fetching it is the one caller's job —
 * `resolveTemplateMedicationRequest` in `MedicationRequestEditor.tsx`,
 * mirroring `serviceRequestRowFromTemplate`'s identical split between a
 * pure model-side merge and an editor-side network fetch) → a fresh row.
 *
 * Every resolved row is exactly as fresh as one `newMedicationRowFrom{Code,
 * Product}` creates: `authored_on` reset to now, `requester` always the
 * applying clinician (a template never stores one), and its OWN empty
 * `create_prescription` shell — so a template-applied row participates in
 * the identical shared-prescription-note mechanism
 * (`MedicationRequestEditor.tsx`'s `handleUpdateNote`, this module's
 * `toRequests` doc comment) as a directly picked medication, not a special
 * case of it.
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

/**
 * A list, not a singleton — like `allergy_intolerance`/`diagnosis`, a row
 * here is born whole the moment `newMedicationRowFrom{Code,Product}` creates
 * it, so there is no separate `isEmptyRow` predicate to keep in sync with a
 * submission filter.
 */
export const projectValues: ProjectValues<MedicationRequestRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "medication_request", value: [...rows] }];

/**
 * The edit log → at most one POST against the upsert endpoint, carrying
 * every medication this session touched (P1-14, landed for real — see
 * `diagnosis/model.ts`'s `toRequests` doc comment for the full argument;
 * identical shape here).
 *
 * PRESCRIPTION IDENTITY. Every genuinely new row (`!row.id` — an `add`, or
 * an `add` reclassified to `updates` by a baseline collision that still
 * carries no server id) gets a freshly generated `alternate_identifier`,
 * computed ONCE per call and shared by every new row in THIS submission —
 * exactly `MedicationRequestQuestion.tsx`'s `handleSaveMedications`
 * (`prescriptionIdentifier`, `:53`): adding two new medications in the same
 * session and saving together groups them under the SAME new prescription,
 * not two. An existing row's own `create_prescription` (there is none —
 * `toMedicationRow` never sets one) is left alone.
 *
 * The whole row is spread into the wire body first, then the few fields the
 * server expects in a different shape are overridden — exactly legacy's own
 * approach (`...medication` first, `requester: medication.requester?.id`
 * last). `dirty` rides along as `undefined` (never set by any function in
 * this module) and drops out of the JSON body on serialize; no explicit
 * strip needed.
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
 *  matches legacy's exact wire convention (`dosage_instruction[i].dose`, and
 *  so on) so a future server-side validation error keyed the same way binds
 *  to the identical cell. */
export interface MedicationRowFieldError {
  rowId: string;
  fieldKey: string;
  /** `"duration"` carries a specific "why it's invalid" reason
   *  (`TimingBoundsError`); every other kind reads as a plain required
   *  error — mirrors legacy's `validateMedicationRequestQuestion`'s own
   *  `field_key?.endsWith(".duration")` branch. */
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
 * duration alone auto-creates a `frequency:1` repeat with no code/text,
 * which must not satisfy this. Exactly
 * `MEDICATION_REQUEST_FIELDS.FREQUENCY.validate` from the legacy widget.
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
 * The richest validator in the codebase, translated to the edit log: for
 * every EDITED (non-removed, non-`entered_in_error`) medication, checks
 * every one of its dosage instructions' dose/frequency/duration, producing
 * one `MedicationRowFieldError` per invalid slot, index-suffixed exactly
 * like legacy's `field_key`s.
 *
 * VALIDATES `edits`, NOT `projection` — deliberately, matching
 * `appointment`/`charge_item`'s N5 constraint: a row-scoped error can only
 * be raised for a row that carries an edit, because the bare projection has
 * no `rowId` to key it to. An untouched baseline medication (never edited
 * this session) was already valid on the server and is not re-validated
 * here — consistent with P1-14's "an untouched section never blocks Save"
 * spirit.
 *
 * A `remove` op and an `entered_in_error` patch are both skipped — mirrors
 * legacy's `if (value.status === "entered_in_error") return errors;` and
 * the chargeItem `invalidQuantityRowIds` precedent ("an edit that resolved
 * to nothing visible must not trip validation").
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
