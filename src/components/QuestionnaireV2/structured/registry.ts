import type { TFunction } from "i18next";
import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { SubjectType } from "@/types/questionnaire/questionnaire";
import type {
  StructuredEditRecord,
  StructuredQuestionType,
} from "@/types/questionnaire/structured";
import { isCoreStructuredType } from "@/types/questionnaire/structured";

import type { PluginStructuredTypeDefinition } from "./pluginRegistry";
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
  StructuredBatchEntry,
  StructuredContextKey,
  StructuredDraftPolicy,
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
 * the array that question's own component wrote — read unnarrowed. A
 * plugin's data shape is opaque to the host (only the plugin's own
 * component, `validate` and `toRequests` interpret it), so there is
 * nothing to narrow to and `unknown[]` is the honest type.
 */
export function structuredDataAny(
  response: QuestionnaireResponse | undefined,
): unknown[] {
  const raw = response?.values?.[0]?.value;
  return Array.isArray(raw) ? raw : [];
}

/**
 * The write-side inverse of {@link structuredDataAny}: wraps projected
 * rows back into the `values` array a structured response stores. The
 * cast is this module's sanctioned narrowing for a GENERIC writer:
 * `ResponseValue`'s structured arms are keyed by core type names with
 * per-type row arrays, but a namespaced plugin type is no union arm at
 * all and its rows are opaque to the host, so there is nothing honest to
 * narrow to. Readers recover the rows via {@link structuredDataAny},
 * which never trusts the arm anyway.
 */
export function projectionResponseValues(
  type: string,
  rows: readonly unknown[],
): ResponseValue[] {
  if (rows.length === 0) return [];
  return [{ type, value: rows }] as unknown as ResponseValue[];
}

/**
 * One structured type as every consumer sees it, whether built in or
 * registered by a plugin. Rows and edits are type-erased here; each
 * definition's own validation and request builder interprets them.
 */
export interface ResolvedStructuredType {
  type: string;
  component: ComponentType<StructuredInputProps>;
  requires: readonly StructuredContextKey[];
  subjects: readonly SubjectType[];
  draftPolicy: StructuredDraftPolicy;
  source: "core" | "plugin";
  /** Plugin only — core labels come from `t("structured_type__<type>")`. */
  label?: string;
  icon?: ComponentType<{ className?: string }>;
  contract: 2;
  validate?: (
    projection: readonly unknown[],
    edits: readonly StructuredEditRecord[],
    questionId: string,
    required: boolean,
  ) => QuestionValidationError[];
  toRequests: (
    edits: readonly StructuredEditRecord[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
}

// Caches for the wrapped view `resolveStructuredType` returns below, keyed
// on the underlying registration — so a caller keying off the returned
// object (`PluginErrorBoundary`'s `resetKey`, via `StructuredSlot`) sees a
// stable identity across calls that resolve the *same* registration, and a
// new one only when the registration itself changes (a plugin re-registering
// the type). Without this, the `{...definition, source}` spread below would
// mint a fresh object on every call — including every unrelated re-render —
// and a resetKey wired to it would reset on every render, not just on a real
// re-register.
const coreResolvedCache = new Map<string, ResolvedStructuredType>();
const pluginResolvedCache = new WeakMap<
  PluginStructuredTypeDefinition,
  ResolvedStructuredType
>();

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
    const cached = coreResolvedCache.get(type);
    if (cached) return cached;
    const definition = STRUCTURED_TYPE_REGISTRY[type];
    // Widening DataTypeFor<K>[] → unknown[] — the one sanctioned cast at
    // this boundary (key-correlation already guaranteed the pairing).
    const resolved = {
      ...definition,
      source: "core",
    } as unknown as ResolvedStructuredType;
    coreResolvedCache.set(type, resolved);
    return resolved;
  }
  const plugin = getPluginStructuredType(type);
  if (!plugin) return undefined;
  const cached = pluginResolvedCache.get(plugin);
  if (cached) return cached;
  const resolved: ResolvedStructuredType = { ...plugin, source: "plugin" };
  pluginResolvedCache.set(plugin, resolved);
  return resolved;
}

/** Subject ids available on the mount, as `StructuredSlot` reads them. */
type StructuredSubjectContext = Partial<Record<StructuredContextKey, string>>;

/**
 * Why a structured question slot is or is not showing an input. `StructuredSlot`,
 * batch composition, and submit-time validators all resolve this state so the
 * UI and submit blocking rules stay aligned. Non-ready required slots produce a
 * blocking `structured_section_unavailable_required` error; non-required slots
 * are skipped as no-ops.
 */
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
