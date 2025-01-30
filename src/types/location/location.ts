import { Code } from "@/types/questionnaire/code";

export type AvailabilityStatus = "available" | "unavailable";

export type Status = "active" | "inactive" | "unknown";

export type OperationalStatus = "C" | "H" | "O" | "U" | "K" | "I";

export type LocationMode = "instance" | "kind";

export type LocationForm =
  | "si"
  | "bu"
  | "wi"
  | "wa"
  | "lvl"
  | "co"
  | "ro"
  | "bd"
  | "ve"
  | "ho"
  | "ca"
  | "rd"
  | "area"
  | "jdn"
  | "vi";

export interface LocationBase {
  status: Status;
  operational_status: OperationalStatus;
  name: string;
  description: string;
  location_type?: Code;
  form: LocationForm;
}

export interface LocationDetail extends LocationBase {
  id: string;
}

export interface LocationList extends LocationBase {
  id: string;
  mode: LocationMode;
  has_children: boolean;
  availability_status: AvailabilityStatus;
}

export interface LocationWrite extends LocationBase {
  id?: string;
  parent?: string;
  organizations: string[];
  mode: LocationMode;
}
