import { ContactPoint } from "@/types/common/contactPoint";
import { Encounter } from "@/types/emr/encounter/encounter";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";
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

export const DEVICE_AVAILABILITY_STATUS_COLORS = {
  lost: "yellow",
  damaged: "destructive",
  destroyed: "destructive",
  available: "green",
  active: "primary",
  inactive: "secondary",
  entered_in_error: "destructive",
} as const;

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
  care_type?: string | undefined;
}

export interface DeviceDetail extends DeviceBase {
  id: string;
  current_encounter: Encounter | undefined;
  current_location: LocationList | undefined;
  created_by: UserBase;
  updated_by: UserBase;
  care_metadata: Record<string, unknown>;
  managing_organization: FacilityOrganization | null;
}

export interface DeviceList extends DeviceBase {
  id: string;
  care_metadata: Record<string, unknown>;
}

export interface DeviceEncounterHistory {
  id: string;
  encounter: Encounter;
  created_by: UserBase;
  start: string;
  end: string;
}

export interface ServiceHistory {
  id: string;
  serviced_on: string;
  note: string;
}

export interface ServiceHistoryWriteRequest {
  serviced_on: string;
  note: string;
}

export interface DeviceLocationHistory {
  id: string;
  created_by: UserBase;
  location: LocationList;
  start: string;
  end: string;
}

export type DeviceWrite = DeviceBase;
