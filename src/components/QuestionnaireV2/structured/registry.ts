import type { TFunction } from "i18next";
import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { SubjectType } from "@/types/questionnaire/questionnaire";
import type { StructuredQuestionType } from "@/types/questionnaire/structured";
import { isCoreStructuredType } from "@/types/questionnaire/structured";

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
import type {
  StructuredContextKey,
  StructuredInputProps,
  StructuredRequestBuilder,
  StructuredTypeDefinition,
} from "./types";

/** Total over `StructuredQuestionType`: a new member fails to compile until it has a definition. */
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

export function structuredDataAny(
  response: QuestionnaireResponse | undefined,
): unknown[] {
  const raw = response?.values?.[0]?.value;
  return Array.isArray(raw) ? raw : [];
}

export interface ResolvedStructuredType {
  type: string;
  component: ComponentType<StructuredInputProps>;
  requires: readonly StructuredContextKey[];
  subjects: readonly SubjectType[];
  draftPolicy: "serialize" | "exclude";
  validate?: (
    data: unknown[],
    questionId: string,
    required: boolean,
  ) => QuestionValidationError[];
  buildRequests: StructuredRequestBuilder;
}

export function resolveStructuredType(
  type: string,
): ResolvedStructuredType | undefined {
  if (!isCoreStructuredType(type)) return undefined;
  return STRUCTURED_TYPE_REGISTRY[type] as unknown as ResolvedStructuredType;
}

/** Subject ids available on the mount, as `StructuredSlot` reads them. */
type StructuredSubjectContext = Partial<Record<StructuredContextKey, string>>;

/** Shared availability check for core structured rendering, validation and submission. */
export type StructuredSlotState =
  | { kind: "ready"; definition: ResolvedStructuredType }
  /** This deployment has no such type (its plugin isn't loaded). */
  | { kind: "unknown_type" }
  /** The type doesn't declare this questionnaire's `subject_type`. */
  | { kind: "subject_mismatch"; definition: ResolvedStructuredType }
  /** The mount can't supply an id the type `requires`. */
  | {
      kind: "missing_context";
      definition: ResolvedStructuredType;
      missing: StructuredContextKey[];
    };

export function resolveStructuredSlotState(
  structuredType: string,
  questionnaireSubjectType: SubjectType,
  subject: StructuredSubjectContext,
): StructuredSlotState {
  const definition = resolveStructuredType(structuredType);
  if (!definition) return { kind: "unknown_type" };
  if (!definition.subjects.includes(questionnaireSubjectType)) {
    return { kind: "subject_mismatch", definition };
  }
  const missing = definition.requires.filter((key) => !subject[key]);
  if (missing.length > 0)
    return { kind: "missing_context", definition, missing };
  return { kind: "ready", definition };
}

export function structuredTypeLabel(type: string, t: TFunction): string {
  return isCoreStructuredType(type) ? t(`structured_type__${type}`) : type;
}
