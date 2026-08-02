import type { TFunction } from "i18next";
import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { SubjectType } from "@/types/questionnaire/questionnaire";
import type { StructuredQuestionType } from "@/types/questionnaire/structured";
import { isCoreStructuredType } from "@/types/questionnaire/structured";

import { getPluginStructuredType } from "./pluginRegistry";

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
  DataTypeFor,
  StructuredBatchEntry,
  StructuredContextKey,
  StructuredInputProps,
  StructuredRequestContext,
  StructuredTypeDefinition,
} from "./types";

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

/**
 * The same entries, unnarrowed — what resolver consumers read. A plugin's
 * data shape is opaque to the host (only the plugin's own component,
 * `validate` and `buildRequests` interpret it), so there is nothing to
 * narrow to and `unknown[]` is the honest type.
 */
export function structuredDataAny(
  response: QuestionnaireResponse | undefined,
): unknown[] {
  const raw = response?.values?.[0]?.value;
  return Array.isArray(raw) ? raw : [];
}

/**
 * One structured type as every consumer sees it, whether it ships with CARE
 * or arrives from a plugin at runtime. Core's compile-time key correlation
 * (`K → Definition<K>`) cannot survive a union with runtime-registered
 * members, so the shared shape reads entries as `unknown[]`: each
 * definition's own `validate`/`buildRequests` is the only code that
 * interprets them, and for core those are still authored against
 * `DataTypeFor<K>` in their own files.
 */
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
  buildRequests: (
    data: unknown[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
  source: "core" | "plugin";
  /** Plugin only — core labels come from `t("structured_type__<type>")`. */
  label?: string;
  icon?: ComponentType<{ className?: string }>;
}

/**
 * The single lookup for a `structured_type` string: core first (bare names
 * are reserved for it), then the plugin registry. `undefined` means the
 * questionnaire references a type this deployment doesn't have — every
 * consumer degrades on its own terms (render a notice, skip on compose,
 * block only a required question, keep it out of drafts) instead of
 * throwing.
 */
export function resolveStructuredType(
  type: string,
): ResolvedStructuredType | undefined {
  if (isCoreStructuredType(type)) {
    const definition = STRUCTURED_TYPE_REGISTRY[type];
    // Widening DataTypeFor<K>[] → unknown[] — the one sanctioned cast at
    // this boundary (key-correlation already guaranteed the pairing).
    return {
      ...definition,
      source: "core",
    } as unknown as ResolvedStructuredType;
  }
  const plugin = getPluginStructuredType(type);
  return plugin ? { ...plugin, source: "plugin" } : undefined;
}

/**
 * What to call a structured type in the UI. Core types read their i18n key;
 * plugin types carry a plain label from their manifest (plugins own their
 * i18n), and an unknown type falls back to its raw id so the studio still
 * shows *something* identifiable.
 */
export function structuredTypeLabel(type: string, t: TFunction): string {
  const resolved = resolveStructuredType(type);
  if (!resolved) return type;
  if (resolved.source === "plugin") return resolved.label ?? type;
  return t(`structured_type__${type}`);
}
