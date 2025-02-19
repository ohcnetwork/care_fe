import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";
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
}

export interface LocationWrite extends LocationBase {
  id?: string;
  parent?: string;
  organizations: string[];
  mode: LocationMode;
}

export const locationFormOptions = [
  { value: "si", label: "Site" },
  { value: "bu", label: "Building" },
  { value: "wi", label: "Wing" },
  { value: "wa", label: "Ward" },
  { value: "lvl", label: "Level" },
  { value: "co", label: "Corridor" },
  { value: "ro", label: "Room" },
  { value: "bd", label: "Bed" },
  { value: "ve", label: "Vehicle" },
  { value: "ho", label: "House" },
  { value: "ca", label: "Cabinet" },
  { value: "rd", label: "Road" },
  { value: "area", label: "Area" },
  { value: "jdn", label: "Jurisdiction" },
  { value: "vi", label: "Virtual" },
];

export const getLocationFormLabel = (value: LocationForm) => {
  return locationFormOptions.find((option) => option.value === value)?.label;
};
