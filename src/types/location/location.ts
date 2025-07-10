import {
  Bed,
  Building,
  Building2,
  Car,
  Eye,
  Home,
  Hospital,
  LucideIcon,
  Map,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Code } from "@/types/base/code/code";
import { Encounter } from "@/types/emr/encounter/encounter";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";

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
  sort_index: number;
}

export interface LocationList extends LocationBase {
  id: string;
  has_children: boolean;
  parent?: LocationList;
  current_encounter?: Encounter;
  sort_index: number;
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

export const LocationTypeIcons = {
  bd: Bed, // bed
  wa: Hospital, // ward
  lvl: Building2, // level/floor
  bu: Building, // building
  si: Map, // site
  wi: Building2, // wing
  co: Building2, // corridor
  ro: Home, // room
  ve: Car, // vehicle
  ho: Home, // house
  ca: Car, // carpark
  rd: Car, // road
  area: Map, // area
  jdn: Map, // garden
  vi: Eye, // virtual
} as const satisfies Record<LocationForm, LucideIcon>;

export const LOCATION_TYPE_BADGE_COLORS = {
  bd: "blue", // bed
  wa: "teal", // ward
  lvl: "green", // level/floor
  bu: "yellow", // building
  si: "orange", // site
  wi: "indigo", // wing
  co: "pink", // corridor
  ro: "blue", // room
  ve: "secondary", // vehicle
  ho: "primary", // house
  ca: "indigo", // carpark
  rd: "yellow", // road
  area: "green", // area
  jdn: "teal", // garden
  vi: "indigo", // virtual
} as const satisfies Record<
  LocationForm,
  React.ComponentProps<typeof Badge>["variant"]
>;
