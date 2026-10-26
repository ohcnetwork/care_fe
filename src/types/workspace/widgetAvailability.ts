import {
  inactiveEncounterStatus,
  type EncounterRead,
} from "@/types/emr/encounter/encounter";

import type { EncounterWorkspaceWidget } from "./encounterWorkspace";
import type { CoreWidgetConfigType } from "./widgetConfigSchemas";

export interface WorkspaceAvailabilityContext {
  facilityId?: string;
  selectedEncounter?: Pick<EncounterRead, "status">;
  canReadClinicalData: boolean;
  canReadPatientHistory: boolean;
  canReadSelectedEncounter: boolean;
  canWriteClinicalData: boolean;
}

export interface WorkspaceWidgetContext extends WorkspaceAvailabilityContext {
  patientId: string;
  selectedEncounter?: EncounterRead;
}

export interface WidgetRequirements {
  encounter: "none" | "any" | "active";
  access: "clinical" | "encounter" | "write";
}

const clinical: WidgetRequirements = { encounter: "any", access: "clinical" };
const details: WidgetRequirements = { encounter: "any", access: "encounter" };
const action: WidgetRequirements = { encounter: "active", access: "write" };
const history: WidgetRequirements = { encounter: "none", access: "clinical" };
const patient: WidgetRequirements = { encounter: "none", access: "encounter" };

export const CORE_WIDGET_REQUIREMENTS = {
  allergies: clinical,
  symptoms: clinical,
  diagnosis: clinical,
  vitals: clinical,
  questionnaire_responses: clinical,
  service_requests: clinical,
  outstanding_orders: clinical,
  current_medications: history,
  recent_encounters: patient,
  quick_actions: action,
  favorite_forms: action,
  draft_forms: action,
  encounter_actions: action,
  encounter_tags: details,
  locations: details,
  care_team: details,
  departments: details,
  hospitalization: details,
  discharge: details,
  audit_logs: details,
  reports: clinical,
  responses: clinical,
  observations: clinical,
  medications: clinical,
  service_request_management: clinical,
  diagnostic_reports: clinical,
  plots: clinical,
  observation_chart: clinical,
  consents: details,
  account: details,
  encounter_summary: details,
  encounter_extensions: clinical,
  clinical_history: history,
  history_responses: history,
  history_diagnostic_reports: history,
  history_symptoms: history,
  history_diagnoses: history,
  history_allergies: history,
  history_medications: history,
} satisfies Record<CoreWidgetConfigType, WidgetRequirements>;

export function getWidgetRequirements(
  type: string,
  requiresActiveEncounter = false,
): WidgetRequirements {
  if (Object.hasOwn(CORE_WIDGET_REQUIREMENTS, type)) {
    return CORE_WIDGET_REQUIREMENTS[type as CoreWidgetConfigType];
  }
  return requiresActiveEncounter
    ? { encounter: "active", access: "clinical" }
    : clinical;
}

export type WidgetHiddenReason =
  | "workspace_hidden_by_status"
  | "workspace_requires_encounter"
  | "workspace_auto_hides_closed"
  | "workspace_requires_editable_encounter";

export type WidgetAvailability =
  | { state: "visible" | "denied" }
  | { state: "hidden"; reason: WidgetHiddenReason };

/** Apply context requirements before mounting widgets or allocating grid tracks. */
export function getWidgetAvailability(
  widget: EncounterWorkspaceWidget,
  context: WorkspaceAvailabilityContext,
  requiresActiveEncounter = false,
): WidgetAvailability {
  const encounter = context.selectedEncounter;
  const requirements = getWidgetRequirements(
    widget.type,
    requiresActiveEncounter,
  );
  if (requirements.encounter !== "none" && !encounter) {
    return { state: "hidden", reason: "workspace_requires_encounter" };
  }
  if (
    requirements.encounter === "active" &&
    encounter &&
    inactiveEncounterStatus.includes(encounter.status)
  ) {
    return { state: "hidden", reason: "workspace_auto_hides_closed" };
  }
  const statuses = widget.visible_when?.["encounter.status"];
  if (statuses && (!encounter || !statuses.includes(encounter.status))) {
    return { state: "hidden", reason: "workspace_hidden_by_status" };
  }
  const canRead =
    (requirements.encounter === "none"
      ? context.canReadPatientHistory
      : context.canReadClinicalData) ||
    (requirements.access === "encounter" && context.canReadSelectedEncounter);
  if (!canRead) return { state: "denied" };
  if (
    requirements.access === "write" &&
    (!context.facilityId || !context.canWriteClinicalData)
  ) {
    return {
      state: "hidden",
      reason: "workspace_requires_editable_encounter",
    };
  }
  return { state: "visible" };
}
