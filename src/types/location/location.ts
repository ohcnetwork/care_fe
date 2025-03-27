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

export const LocationTypeBadgeColors = {
  bd: "bg-blue-100 text-blue-900", // bed
  wa: "bg-teal-100 text-teal-900", // ward
  lvl: "bg-green-100 text-green-900", // level/floor
  bu: "bg-yellow-100 text-yellow-900", // building
  si: "bg-red-100 text-red-900", // site
  wi: "bg-indigo-100 text-indigo-900", // wing
  co: "bg-pink-100 text-pink-900", // corridor
  ro: "bg-blue-100 text-blue-900", // room
  ve: "bg-cyan-100 text-cyan-900", // vehicle
  ho: "bg-emerald-100 text-emerald-900", // house
  ca: "bg-violet-100 text-violet-900", // carpark
  rd: "bg-amber-100 text-amber-900", // road
  area: "bg-lime-100 text-lime-900", // area
  jdn: "bg-teal-100 text-teal-900", // garden
  vi: "bg-rose-100 text-rose-900", // virtual
} as const satisfies Record<LocationForm, string>;
