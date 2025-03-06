import { ContactPoint } from "@/types/common/contactPoint";
import { Encounter } from "@/types/emr/encounter";
import { LocationList } from "@/types/location/location";
import { UserBase } from "@/types/user/user";

export const DeviceStatuses = [
  "active",
  "inactive",
  "entered_in_error",
] as const;

export type DeviceStatus = (typeof DeviceStatuses)[number];

export const DeviceAvailabilityStatuses = [
  "lost",
  "damaged",
  "destroyed",
  "available",
] as const;

export type DeviceAvailabilityStatus =
  (typeof DeviceAvailabilityStatuses)[number];

export interface DeviceBase {
  identifier?: string;
  status: DeviceStatus;
  availability_status: DeviceAvailabilityStatus;
  manufacturer?: string;
  manufacture_date?: string; // datetime
  expiration_date?: string; // datetime
  lot_number?: string;
  serial_number?: string;
  registered_name: string;
  user_friendly_name?: string;
  model_number?: string;
  part_number?: string;
  contact: ContactPoint[];
  //   care_type: string | undefined;
}

export interface DeviceDetail extends DeviceBase {
  id: string;
  current_encounter: Encounter | undefined;
  current_location: LocationList | undefined;
  created_by: UserBase;
  updated_by: UserBase;
}

export interface DeviceList extends DeviceBase {
  id: string;
}

export interface DeviceLocationHistory {
  id: string;
  created_by: UserBase;
  location: LocationList;
  start: string;
  end: string;
}

export type DeviceWrite = DeviceBase;
