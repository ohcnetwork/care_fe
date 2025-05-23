import {
  Ambulance,
  BedDouble,
  Building2,
  Home,
  LucideIcon,
  MonitorSmartphone,
  Stethoscope,
} from "lucide-react";

import { CareTeamResponse } from "@/types/careTeam/careTeam";
import { Patient } from "@/types/emr/patient";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";
import { LocationAssociationStatus } from "@/types/location/association";
import { LocationList } from "@/types/location/location";
import { UserBase } from "@/types/user/user";

export const ENCOUNTER_ADMIT_SOURCE = [
  "hosp_trans",
  "emd",
  "outp",
  "born",
  "gp",
  "mp",
  "nursing",
  "psych",
  "rehab",
  "other",
] as const;

export const ENCOUNTER_CLASS = [
  "imp",
  "amb",
  "obsenc",
  "emer",
  "vr",
  "hh",
] as const;

export const ENCOUNTER_CLASSES = [
  { id: "imp", name: "Inpatient", icon: "l-bed" },
  { id: "amb", name: "Ambulatory", icon: "l-ambulance" },
  { id: "obsenc", name: "Observation", icon: "l-stethoscope" },
  { id: "emer", name: "Emergency", icon: "l-building" },
  { id: "vr", name: "Virtual", icon: "l-monitor" },
  { id: "hh", name: "Home Health", icon: "l-home" },
] as const;

export const ENCOUNTER_DIET_PREFERENCE = [
  "vegetarian",
  "dairy_free",
  "nut_free",
  "gluten_free",
  "vegan",
  "halal",
  "kosher",
  "none",
] as const;

export const ENCOUNTER_DISCHARGE_DISPOSITION = [
  "home",
  "alt_home",
  "other_hcf",
  "hosp",
  "long",
  "aadvice",
  "exp",
  "psy",
  "rehab",
  "snf",
  "oth",
] as const;

export const ENCOUNTER_PRIORITY = [
  "stat",
  "ASAP",
  "emergency",
  "urgent",
  "routine",
  "elective",
  "rush_reporting",
  "timing_critical",
  "callback_results",
  "callback_for_scheduling",
  "preop",
  "as_needed",
  "use_as_directed",
] as const;

export const ENCOUNTER_STATUSES = [
  { id: "planned", icon: "l-calender" },
  { id: "in_progress", icon: "l-spinner" },
  { id: "on_hold" },
  { id: "discharged", icon: "l-home" },
  { id: "completed", icon: "l-check" },
  { id: "cancelled", icon: "l-x" },
  { id: "discontinued" },
  { id: "entered_in_error" },
  { id: "unknown" },
] as const;

export const ENCOUNTER_STATUS = ENCOUNTER_STATUSES.map((status) => status.id);

export const ENCOUNTER_CLASSES_ICONS = {
  imp: BedDouble,
  amb: Ambulance,
  obsenc: Stethoscope,
  emer: Building2,
  vr: MonitorSmartphone,
  hh: Home,
} as const satisfies Record<EncounterClass, LucideIcon>;

export const ENCOUNTER_PRIORITIES = [
  { id: "stat", emote: "🔴" },
  { id: "ASAP", emote: "🟡" },
  { id: "emergency", emote: "🔴" },
  { id: "urgent", emote: "🟠" },
  { id: "routine", emote: "⚪️" },
  { id: "elective", emote: "🟤" },
  { id: "rush_reporting", emote: "🟤" },
  { id: "timing_critical", emote: "🟡" },
  { id: "callback_results", emote: "🔵" },
  { id: "callback_for_scheduling", emote: "🟣" },
  { id: "preop", emote: "🟠" },
  { id: "as_needed", emote: "⚫️" },
  { id: "use_as_directed", emote: "🔵" },
] as const satisfies { id: EncounterPriority; emote: string }[];

export type EncounterAdmitSources = (typeof ENCOUNTER_ADMIT_SOURCE)[number];

export type EncounterClass = (typeof ENCOUNTER_CLASS)[number];

export type EncounterDietPreference =
  (typeof ENCOUNTER_DIET_PREFERENCE)[number];

export type EncounterDischargeDisposition =
  (typeof ENCOUNTER_DISCHARGE_DISPOSITION)[number];

export type EncounterPriority = (typeof ENCOUNTER_PRIORITY)[number];

export type EncounterStatus = (typeof ENCOUNTER_STATUS)[number];

export type Period = {
  start?: string;
  end?: string;
};

export type Hospitalization = {
  re_admission: boolean;
  admit_source: EncounterAdmitSources;
  discharge_disposition?: EncounterDischargeDisposition;
  diet_preference?: EncounterDietPreference;
};

export type History = {
  status: string;
  moved_at: string;
};

export type EncounterClassHistory = {
  history: History[];
};

export type StatusHistory = {
  history: History[];
};

export type LocationHistory = {
  id: string;
  start_datetime: string;
  location: LocationList;
  status: LocationAssociationStatus;
  end_datetime?: string;
};

export interface Encounter {
  id: string;
  patient: Patient;
  facility: {
    id: string;
    name: string;
  };
  status: EncounterStatus;
  encounter_class: EncounterClass;
  period: Period;
  hospitalization?: Hospitalization;
  priority: EncounterPriority;
  external_identifier?: string;
  created_by: UserBase;
  updated_by: UserBase;
  created_date: string;
  modified_date: string;
  encounter_class_history: EncounterClassHistory;
  status_history: StatusHistory;
  organizations: FacilityOrganization[];
  current_location: LocationList;
  location_history: LocationHistory[];
  permissions: string[];
  care_team: CareTeamResponse[];
  discharge_summary_advice?: string;
}

export interface EncounterEditRequest {
  organizations: string[];
  patient: string;
  status: EncounterStatus;
  encounter_class: EncounterClass;
  period: Period;
  hospitalization?: Hospitalization;
  priority: EncounterPriority;
  external_identifier?: string;
  facility: string;
  discharge_summary_advice?: string | null;
}

export interface EncounterRequest {
  organizations: string[];
  patient: string;
  status: EncounterStatus;
  encounter_class: EncounterClass;
  period: Period;
  hospitalization?: Hospitalization;
  priority: EncounterPriority;
  external_identifier?: string;
  facility: string;
  discharge_summary_advice?: string;
}

export const completedEncounterStatus = ["completed"];
export const inactiveEncounterStatus = [
  ...["cancelled", "entered_in_error", "discontinued"],
  ...completedEncounterStatus,
] as const;
