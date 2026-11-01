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
  canWriteSelectedEncounter: boolean;
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
  /**
   * "optional" widgets scope to the selected encounter when there is one and
   * show patient-wide data otherwise, so they also work on history pages.
   */
  encounter: "none" | "optional" | "any" | "active";
  /** "actions" also accepts referral creation, matching the quick actions strip. */
  access: "clinical" | "encounter" | "encounter-write" | "write" | "actions";
  /** Which patient-history grant a widget without an encounter needs. */
  history?: "clinical" | "responses";
}

const clinical: WidgetRequirements = { encounter: "any", access: "clinical" };
const details: WidgetRequirements = { encounter: "any", access: "encounter" };
const action: WidgetRequirements = { encounter: "active", access: "write" };
const encounterManagement: WidgetRequirements = {
  encounter: "active",
  access: "encounter-write",
};
const shortcuts: WidgetRequirements = {
  encounter: "active",
  access: "actions",
};
const history: WidgetRequirements = { encounter: "none", access: "clinical" };
const scoped: WidgetRequirements = {
  encounter: "optional",
  access: "clinical",
  history: "clinical",
};
const scopedResponses: WidgetRequirements = {
  ...scoped,
  history: "responses",
};
const patient: WidgetRequirements = { encounter: "none", access: "encounter" };

export const CORE_WIDGET_REQUIREMENTS = {
  allergies: scoped,
  symptoms: scoped,
  diagnosis: scoped,
  vitals: scoped,
  questionnaire_responses: scopedResponses,
  procedures: scoped,
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
  observation_chart: scoped,
  account: details,
  encounter_summary: details,
  encounter_extensions: clinical,
} satisfies Record<CoreWidgetConfigType, WidgetRequirements>;

/** What a plugin widget declares about the encounters it can render for. */
export interface WidgetCapabilities {
  requiresActiveEncounter?: boolean;
  supportsPatientHistory?: boolean;
}

export function getWidgetRequirements(
  type: string,
  capabilities: WidgetCapabilities = {},
): WidgetRequirements {
  if (Object.hasOwn(CORE_WIDGET_REQUIREMENTS, type)) {
    return CORE_WIDGET_REQUIREMENTS[type as CoreWidgetConfigType];
  }
  if (capabilities.requiresActiveEncounter) {
    return { encounter: "active", access: "clinical" };
  }
  return capabilities.supportsPatientHistory ? scoped : clinical;
}

/** Whether a widget can render on a page that has no selected encounter. */
export function worksWithoutEncounter(requirements: WidgetRequirements) {
  return (
    requirements.encounter === "none" || requirements.encounter === "optional"
  );
}

/** A summary narrowed to its actions tab renders only for editable encounters. */
function widgetInstanceRequirements(
  widget: EncounterWorkspaceWidget,
  capabilities: WidgetCapabilities,
): WidgetRequirements {
  if (widget.type === "encounter_summary") {
    const tabs = encounterSummaryConfigSchema.safeParse(widget.config).data
      ?.tabs;
    if (tabs?.length === 1 && tabs[0] === "actions") return encounterManagement;
  }
  return getWidgetRequirements(widget.type, capabilities);
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
  capabilities: WidgetCapabilities = {},
): WidgetAvailability {
  const encounter = context.selectedEncounter;
  const requirements = widgetInstanceRequirements(widget, capabilities);
  if (!worksWithoutEncounter(requirements) && !encounter) {
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
      : grants.clinicalData;
  const patientWide =
    requirements.encounter === "none" ||
    (requirements.encounter === "optional" && !encounter);
  const canRead =
    (patientWide ? historyRead : context.canReadClinicalData) ||
    ((requirements.access === "encounter" ||
      requirements.access === "encounter-write") &&
      context.canReadSelectedEncounter);
  if (!canRead) return { state: "denied" };
  const canAct =
    requirements.access === "encounter-write"
      ? context.canWriteSelectedEncounter
      : context.canWriteClinicalData ||
        (requirements.access === "actions" &&
          !!context.selectedEncounterPermissions?.canCreateReferral);
  if (
    (requirements.access === "write" ||
      requirements.access === "encounter-write" ||
      requirements.access === "actions") &&
    (!context.facilityId || !canAct)
  ) {
    return {
      state: "hidden",
      reason: "workspace_requires_editable_encounter",
    };
  }
  return { state: "visible" };
}
