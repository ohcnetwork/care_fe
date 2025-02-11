import { ContactPoint } from "@/types/common/contactPoint";
import { Encounter } from "@/types/emr/encounter";
import { LocationDetail } from "@/types/location/location";

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
  manufacturer_date?: string; // datetime
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
  current_location: LocationDetail | undefined; // TODO: verify this type
}

export interface DeviceList extends DeviceBase {
  id: string;
}

export type DeviceWrite = DeviceBase;
