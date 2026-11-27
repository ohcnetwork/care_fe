import { z } from "zod";

// Relative imports: vite.config.mts loads this file through
// scripts/validate-env.ts, where the "@/" alias doesn't resolve.

import {
  ALLERGY_CATEGORY,
  ALLERGY_CLINICAL_STATUS,
  ALLERGY_CRITICALITY,
} from "./allergyIntolerance/allergyIntolerance";
import {
  DIAGNOSIS_CATEGORY,
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_SEVERITY,
  DIAGNOSIS_VERIFICATION_STATUS,
} from "./diagnosis/diagnosis";
import {
  ENCOUNTER_CLASS,
  ENCOUNTER_DISCHARGE_DISPOSITION,
  ENCOUNTER_PRIORITY,
} from "./encounter/encounter";
import { IMMUNIZATION_CREATE_STATUS } from "./immunization/immunization";
import type { MedicationAdministrationStatus } from "./medicationAdministration/medicationAdministration";
import type {
  MedicationCategory,
  MedicationPriority,
  MedicationRequestIntent,
} from "./medicationRequest/medicationRequest";
import {
  MEDICATION_STATEMENT_STATUS,
  MedicationStatementInformationSourceType,
} from "./medicationStatement";
import { PROCEDURE_STATUS } from "./procedure/procedure";
import type {
  Intent as ServiceRequestIntent,
  Priority as ServiceRequestPriority,
  Status as ServiceRequestStatus,
} from "./serviceRequest/serviceRequest";
import {
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  SYMPTOM_VERIFICATION_STATUS,
} from "./symptom/symptom";

// ALLERGY_VERIFICATION_STATUS is a label map, not a list of values.
const ALLERGY_VERIFICATION_STATUS = [
  "unconfirmed",
  "confirmed",
  "refuted",
  "presumed",
] as const;

// ponytail: copied, not imported. Those modules load src/Utils/decimal.ts,
// which reads careConfig at load time, and care.config.ts imports this file.
// `satisfies` keeps each list to valid values; add a new value here too.
const MEDICATION_REQUEST_INTENT = [
  "proposal",
  "plan",
  "order",
  "original_order",
  "reflex_order",
  "filler_order",
  "instance_order",
] as const satisfies readonly MedicationRequestIntent[];
const MEDICATION_PRIORITY = [
  "stat",
  "urgent",
  "asap",
  "routine",
] as const satisfies readonly `${MedicationPriority}`[];
const MEDICATION_CATEGORY = [
  "inpatient",
  "outpatient",
  "community",
  "discharge",
] as const satisfies readonly `${MedicationCategory}`[];
const MEDICATION_ADMINISTRATION_STATUS = [
  "completed",
  "not_done",
  "entered_in_error",
  "stopped",
  "in_progress",
  "on_hold",
  "cancelled",
] as const satisfies readonly MedicationAdministrationStatus[];
const SERVICE_REQUEST_STATUS = [
  "draft",
  "active",
  "on_hold",
  "entered_in_error",
  "ended",
  "completed",
  "revoked",
  "unknown",
] as const satisfies readonly `${ServiceRequestStatus}`[];
const SERVICE_REQUEST_INTENT = [
  "order",
  "proposal",
  "plan",
  "directive",
] as const satisfies readonly `${ServiceRequestIntent}`[];
const SERVICE_REQUEST_PRIORITY = [
  "routine",
  "urgent",
  "asap",
  "stat",
] as const satisfies readonly `${ServiceRequestPriority}`[];

/**
 * A field the clinician picks in the form. `null` is "none": the field starts
 * empty and the form can't be saved until the clinician picks a value.
 */
const choice = <const T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number] | null,
) => newEntryValue(values).nullable().default(fallback);

/** A field the form sets without asking the clinician; it can't be none. */
const fixed = <const T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number],
) => newEntryValue(values).default(fallback);

/** A new entry can't start out as entered in error. */
function newEntryValue<const T extends readonly [string, ...string[]]>(
  values: T,
) {
  return z.enum(values).refine((value) => value !== "entered_in_error", {
    message: "A new entry can't default to entered_in_error",
  });
}

/** "now" fills in the current time; "none" leaves the date for the clinician. */
const dateDefault = (fallback: "now" | "none") =>
  z.enum(["now", "none"]).default(fallback);

// `prefault({})` runs the field defaults when a whole entity is left out.
const entity = <S extends z.ZodRawShape>(shape: S) =>
  // Every field has a default, so {} is valid input; TS can't see that for a generic shape.
  z.strictObject(shape).prefault({} as never);

/**
 * Defaults for new clinical entries in an encounter, set per deployment with
 * the `REACT_CLINICAL_DEFAULTS` JSON env (see .example.env). Every key is
 * optional, and the built-in values are the ones the forms used before.
 */
export const clinicalDefaultsSchema = z
  .strictObject({
    symptom: entity({
      clinical_status: choice(SYMPTOM_CLINICAL_STATUS, "active"),
      verification_status: choice(SYMPTOM_VERIFICATION_STATUS, "confirmed"),
      severity: choice(SYMPTOM_SEVERITY, "moderate"),
      onset: dateDefault("now"),
    }),
    diagnosis: entity({
      clinical_status: choice(DIAGNOSIS_CLINICAL_STATUS, "active"),
      verification_status: choice(DIAGNOSIS_VERIFICATION_STATUS, "confirmed"),
      severity: choice(DIAGNOSIS_SEVERITY, "moderate"),
      category: fixed(DIAGNOSIS_CATEGORY, "encounter_diagnosis"),
      onset: dateDefault("now"),
    }),
    allergy: entity({
      clinical_status: choice(ALLERGY_CLINICAL_STATUS, "active"),
      verification_status: choice(ALLERGY_VERIFICATION_STATUS, "confirmed"),
      category: choice(ALLERGY_CATEGORY, "medication"),
      criticality: choice(ALLERGY_CRITICALITY, "low"),
    }),
    medicationRequest: entity({
      intent: choice(MEDICATION_REQUEST_INTENT, "order"),
      priority: fixed(MEDICATION_PRIORITY, "routine"),
      category: fixed(MEDICATION_CATEGORY, "inpatient"),
    }),
    medicationStatement: entity({
      status: choice(MEDICATION_STATEMENT_STATUS, "active"),
      information_source: choice(
        Object.values(MedicationStatementInformationSourceType) as [
          MedicationStatementInformationSourceType,
          ...MedicationStatementInformationSourceType[],
        ],
        MedicationStatementInformationSourceType.PATIENT,
      ),
    }),
    medicationAdministration: entity({
      status: choice(MEDICATION_ADMINISTRATION_STATUS, "completed"),
    }),
    procedure: entity({
      status: choice(PROCEDURE_STATUS, "completed"),
    }),
    serviceRequest: entity({
      status: fixed(SERVICE_REQUEST_STATUS, "active"),
      intent: fixed(SERVICE_REQUEST_INTENT, "order"),
      priority: fixed(SERVICE_REQUEST_PRIORITY, "routine"),
    }),
    immunization: entity({
      status: choice(IMMUNIZATION_CREATE_STATUS, "completed"),
      occurrence: dateDefault("now"),
    }),
    encounter: entity({
      // null: the only allowed class when there is one, else the clinician picks.
      class: choice(ENCOUNTER_CLASS, null),
      priority: choice(ENCOUNTER_PRIORITY, "routine"),
      discharge_disposition: choice(ENCOUNTER_DISCHARGE_DISPOSITION, null),
    }),
  })
  .prefault({});

export type ClinicalDefaults = z.infer<typeof clinicalDefaultsSchema>;
