import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { StructuredQuestionType } from "@/types/questionnaire/structured";

import { allergyIntoleranceDefinition } from "./definitions/allergyIntolerance";
import { appointmentDefinition } from "./definitions/appointment";
import { chargeItemDefinition } from "./definitions/chargeItem";
import { diagnosisDefinition } from "./definitions/diagnosis";
import { encounterDefinition } from "./definitions/encounter";
import { filesDefinition } from "./definitions/files";
import { medicationRequestDefinition } from "./definitions/medicationRequest";
import { medicationStatementDefinition } from "./definitions/medicationStatement";
import { serviceRequestDefinition } from "./definitions/serviceRequest";
import { symptomDefinition } from "./definitions/symptom";
import { timeOfDeathDefinition } from "./definitions/timeOfDeath";
import type { DataTypeFor, StructuredTypeDefinition } from "./types";

/**
 * The one registration point for structured question types. Total over
 * `StructuredQuestionType` and key-correlated (`K → Definition<K>`), so
 * adding a member to `STRUCTURED_QUESTION_TYPES` without a definition —
 * or a definition whose data/request types drift from its key — fails to
 * compile. Everything a type needs lives in its definition file:
 * component, context requirements, validation, request building, draft
 * policy.
 */
export const STRUCTURED_TYPE_REGISTRY: {
  [K in StructuredQuestionType]: StructuredTypeDefinition<K>;
} = {
  allergy_intolerance: allergyIntoleranceDefinition,
  medication_request: medicationRequestDefinition,
  medication_statement: medicationStatementDefinition,
  symptom: symptomDefinition,
  diagnosis: diagnosisDefinition,
  encounter: encounterDefinition,
  appointment: appointmentDefinition,
  files: filesDefinition,
  time_of_death: timeOfDeathDefinition,
  service_request: serviceRequestDefinition,
  charge_item: chargeItemDefinition,
};

export function structuredDefinitionFor<K extends StructuredQuestionType>(
  type: K,
): StructuredTypeDefinition<K> {
  return STRUCTURED_TYPE_REGISTRY[type];
}

/**
 * The recorded entries for a structured question — `values[0].value` is
 * the array that question's own component wrote. The cast is the module's
 * single sanctioned narrowing: the registry's key-correlation guarantees
 * the component that produced the value matches `type`.
 */
export function structuredDataOf<K extends StructuredQuestionType>(
  type: K,
  response: QuestionnaireResponse | undefined,
): DataTypeFor<K>[] {
  if (response?.structured_type !== type) return [];
  const raw = response.values?.[0]?.value;
  return Array.isArray(raw) ? (raw as DataTypeFor<K>[]) : [];
}
