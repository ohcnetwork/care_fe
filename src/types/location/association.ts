export const LOCATION_ASSOCIATION_STATUSES = [
  "planned",
  "active",
  "reserved",
  "completed",
] as const;

export type LocationAssociationStatus =
  (typeof LOCATION_ASSOCIATION_STATUSES)[number];

export interface LocationAssociation {
  meta: Record<string, any>;
  id: string | null;
  encounter: string;
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
