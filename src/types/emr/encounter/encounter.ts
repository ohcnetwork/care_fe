import {
  Ambulance,
  BedDouble,
  Home,
  LucideIcon,
  MonitorSmartphone,
  Siren,
  Stethoscope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { CareTeamResponse } from "@/types/careTeam/careTeam";
import { PatientRead } from "@/types/emr/patient/patient";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
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

export const ENCOUNTER_PRIORITY_COLORS = {
  stat: "destructive",
  ASAP: "yellow",
  emergency: "destructive",
  urgent: "orange",
  routine: "blue",
  elective: "indigo",
  rush_reporting: "orange",
  timing_critical: "yellow",
  callback_results: "green",
  callback_for_scheduling: "purple",
  preop: "pink",
  as_needed: "teal",
  use_as_directed: "indigo",
} as const satisfies Record<
  EncounterPriority,
  React.ComponentProps<typeof Badge>["variant"]
>;

export const ENCOUNTER_STATUS = [
  "planned",
  "in_progress",
  "on_hold",
  "discharged",
  "completed",
  "cancelled",
  "discontinued",
  "entered_in_error",
  "unknown",
] as const;

export const ENCOUNTER_STATUS_COLORS = {
  planned: "blue",
  in_progress: "yellow",
  on_hold: "orange",
  discharged: "primary",
  completed: "green",
  cancelled: "destructive",
  discontinued: "destructive",
  entered_in_error: "destructive",
  unknown: "secondary",
} as const satisfies Record<
  EncounterStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

export const ENCOUNTER_CLASS_ICONS = {
  imp: BedDouble,
  amb: Ambulance,
  obsenc: Stethoscope,
  emer: Siren,
  vr: MonitorSmartphone,
  hh: Home,
} as const satisfies Record<EncounterClass, LucideIcon>;

export const ENCOUNTER_STATUS_ICONS = {
  planned: "l-calender",
  in_progress: "l-spinner",
  discharged: "l-home",
  completed: "l-check",
  cancelled: "l-x",
} as const satisfies Partial<Record<EncounterStatus, string>>;

export const ENCOUNTER_CLASSES_COLORS = {
  imp: "indigo", // Inpatient
  emer: "destructive", // Emergency
  amb: "green", // Outpatient/Ambulatory
  obsenc: "secondary", // Observation
  vr: "secondary", // Virtual
  hh: "teal", // Home Health
} as const satisfies Record<EncounterClass, string>;

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
  re_admission?: boolean;
  admit_source?: EncounterAdmitSources;
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

export interface EncounterBase {
  id: string;
  patient: string;
  facility: string;
  status: EncounterStatus;
  encounter_class: EncounterClass;
  period: Period;
  hospitalization?: Hospitalization | null;
  priority: EncounterPriority;
  external_identifier?: string;
  discharge_summary_advice?: string | null;
}

export interface EncounterRead
  extends Omit<EncounterBase, "patient" | "facility"> {
  patient: PatientRead;
  facility: {
    id: string;
    name: string;
  };
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
  tags: TagConfig[];
}

export interface EncounterCreate extends Omit<EncounterBase, "id"> {
  organizations: string[];
}

export type EncounterEdit = Omit<EncounterBase, "id">;

export const completedEncounterStatus = ["completed"];
export const inactiveEncounterStatus = [
  ...["cancelled", "entered_in_error", "discontinued"],
  ...completedEncounterStatus,
] as const;
