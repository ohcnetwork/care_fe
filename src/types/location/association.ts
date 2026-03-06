import { EncounterRead } from "@/types/emr/encounter/encounter";
import { LocationRead } from "@/types/location/location";

export const LOCATION_ASSOCIATION_STATUSES = [
  "planned",
  "active",
  "reserved",
  "completed",
] as const;

export type LocationAssociationStatus =
  (typeof LOCATION_ASSOCIATION_STATUSES)[number];

export type LocationAssociationRead = {
  id: string;
  start_datetime: string;
  location: LocationRead;
  status: LocationAssociationStatus;
  end_datetime?: string;
};

export interface LocationAssociation {
  meta: Record<string, any>;
  id: string | null;
  encounter: EncounterRead;
  start_datetime: string;
  end_datetime: string | null;
  status: LocationAssociationStatus;
  created_by: string | null;
  updated_by: string | null;
}

export interface LocationAssociationRequest {
  meta?: Record<string, any>;
  encounter: string;
  start_datetime: string;
  end_datetime?: string;
  status: LocationAssociationStatus;
  location: string;
}

export interface LocationAssociationUpdate extends LocationAssociationRequest {
  id: string;
}
