import {
  inactiveEncounterStatus,
  type EncounterRead,
} from "@/types/emr/encounter/encounter";

import type { EncounterWorkspaceWidget } from "./encounterWorkspace";
import {
  encounterSummaryConfigSchema,
  type CoreWidgetConfigType,
} from "./widgetConfigSchemas";

export interface WorkspaceAvailabilityContext {
  facilityId?: string;
  selectedEncounter?: Pick<EncounterRead, "status">;
  canReadClinicalData: boolean;
  canReadPatientHistory: boolean;
  canReadSelectedEncounter: boolean;
  canWriteClinicalData: boolean;
  /** Response history can be granted separately from clinical history. */
  canReadPatientResponses?: boolean;
  /** Referral creation keeps quick actions useful without clinical write access. */
  selectedEncounterPermissions?: { canCreateReferral: boolean };
  /** False once the installed apps are known to add nothing to the extension slot. */
  hasEncounterExtensions?: boolean;
}

export interface WorkspaceWidgetContext extends WorkspaceAvailabilityContext {
  patientId: string;
  selectedEncounter?: EncounterRead;
}

export interface WidgetRequirements {
  encounter: "none" | "any" | "active";
  /** "actions" also accepts referral creation, matching the quick actions strip. */
  access: "clinical" | "encounter" | "write" | "actions";
  /** Which patient-history grant a widget without an encounter needs. */
  history?: "clinical" | "responses" | "any";
}

const clinical: WidgetRequirements = { encounter: "any", access: "clinical" };
const details: WidgetRequirements = { encounter: "any", access: "encounter" };
const action: WidgetRequirements = { encounter: "active", access: "write" };
const shortcuts: WidgetRequirements = {
  encounter: "active",
  access: "actions",
};
const history: WidgetRequirements = { encounter: "none", access: "clinical" };
const responses: WidgetRequirements = { ...history, history: "responses" };
const anyHistory: WidgetRequirements = { ...history, history: "any" };
const patient: WidgetRequirements = { encounter: "none", access: "encounter" };

export const CORE_WIDGET_REQUIREMENTS = {
  allergies: clinical,
  symptoms: clinical,
  diagnosis: clinical,
  vitals: clinical,
  questionnaire_responses: clinical,
  service_requests: clinical,
  referrals: details,
  outstanding_orders: clinical,
  current_medications: history,
  recent_encounters: patient,
  quick_actions: shortcuts,
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
  clinical_history: anyHistory,
  history_responses: responses,
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

/** A summary narrowed to its actions tab renders only for editable encounters. */
function widgetInstanceRequirements(
  widget: EncounterWorkspaceWidget,
  requiresActiveEncounter: boolean,
): WidgetRequirements {
  if (widget.type === "encounter_summary") {
    const tabs = encounterSummaryConfigSchema.safeParse(widget.config).data
      ?.tabs;
    if (tabs?.length === 1 && tabs[0] === "actions") return action;
  }
  return getWidgetRequirements(widget.type, requiresActiveEncounter);
}

export type WidgetHiddenReason =
  | "workspace_hidden_by_status"
  | "workspace_requires_encounter"
  | "workspace_auto_hides_closed"
  | "workspace_requires_editable_encounter"
  | "workspace_no_extensions";

/** Grants for patient-wide history sections, derived from the widget context. */
export function patientHistoryAccess(context: WorkspaceAvailabilityContext) {
  return {
    clinicalData: context.canReadPatientHistory,
    responses: context.canReadPatientResponses ?? context.canReadPatientHistory,
  };
}

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
  const requirements = widgetInstanceRequirements(
    widget,
    requiresActiveEncounter,
  );
  if (requirements.encounter !== "none" && !encounter) {
    return { state: "hidden", reason: "workspace_requires_encounter" };
  }
  // Referrals can still be raised from a closed encounter, so the shortcut
  // strip stays for users who hold that permission.
  const referralShortcut =
    requirements.access === "actions" &&
    !!context.facilityId &&
    !!context.selectedEncounterPermissions?.canCreateReferral;
  if (
    requirements.encounter === "active" &&
    encounter &&
    inactiveEncounterStatus.includes(encounter.status) &&
    !referralShortcut
  ) {
    return { state: "hidden", reason: "workspace_auto_hides_closed" };
  }
  if (
    widget.type === "encounter_extensions" &&
    context.hasEncounterExtensions === false
  ) {
    return { state: "hidden", reason: "workspace_no_extensions" };
  }
  const statuses = widget.visible_when?.["encounter.status"];
  if (statuses && (!encounter || !statuses.includes(encounter.status))) {
    return { state: "hidden", reason: "workspace_hidden_by_status" };
  }
  const grants = patientHistoryAccess(context);
  const historyRead =
    requirements.history === "responses"
      ? grants.responses
      : requirements.history === "any"
        ? grants.clinicalData || grants.responses
        : grants.clinicalData;
  const canRead =
    (requirements.encounter === "none"
      ? historyRead
      : context.canReadClinicalData) ||
    (requirements.access === "encounter" && context.canReadSelectedEncounter);
  if (!canRead) return { state: "denied" };
  const canAct =
    context.canWriteClinicalData ||
    (requirements.access === "actions" &&
      !!context.selectedEncounterPermissions?.canCreateReferral);
  if (
    (requirements.access === "write" || requirements.access === "actions") &&
    (!context.facilityId || !canAct)
  ) {
    return {
      state: "hidden",
      reason: "workspace_requires_editable_encounter",
    };
  }
  return { state: "visible" };
}
