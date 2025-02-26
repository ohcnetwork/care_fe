import { Encounter } from "@/types/emr/encounter";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";
import { Code } from "@/types/questionnaire/code";

export type AvailabilityStatus = "available" | "unavailable";

export type Status = "active" | "inactive" | "unknown";

export type OperationalStatus = "C" | "H" | "O" | "U" | "K" | "I";

export type LocationMode = "instance" | "kind";

export type LocationForm = (typeof LocationFormOptions)[number];

export interface LocationBase {
  status: Status;
  operational_status: OperationalStatus;
  name: string;
  description: string;
  location_type?: Code;
  form: LocationForm;
  mode: LocationMode;
  availability_status: AvailabilityStatus;
}

export interface LocationDetail extends LocationBase {
  id: string;
  organizations: FacilityOrganization[];
}

export interface LocationList extends LocationBase {
  id: string;
  has_children: boolean;
  parent?: LocationList;
  current_encounter?: Encounter;
}

export interface LocationWrite extends LocationBase {
  id?: string;
  parent?: string;
  organizations: string[];
  mode: LocationMode;
}

export const LocationFormOptions = [
  "si",
  "bu",
  "wi",
  "wa",
  "lvl",
  "co",
  "ro",
  "bd",
  "ve",
  "ho",
  "ca",
  "rd",
  "area",
  "jdn",
  "vi",
] as const;
