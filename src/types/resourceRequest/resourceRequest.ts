import { UserBareMinimum } from "@/components/Users/models";

import { PatientRead } from "@/types/emr/patient/patient";
import { FacilityRead } from "@/types/facility/facility";
import { UserReadMinimal } from "@/types/user/user";

export const RESOURCE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "transportation_to_be_arranged",
  "transfer_in_progress",
  "completed",
] as const;

export type ResourceRequestStatus = (typeof RESOURCE_REQUEST_STATUSES)[number];

export interface ResourceRequest {
  approving_facility: FacilityRead | null;
  assigned_facility: FacilityRead | undefined;
  category: string;
  emergency: boolean;
  id: string;
  origin_facility: FacilityRead;
  priority: number;
  reason: string;
  referring_facility_contact_name: string;
  referring_facility_contact_number: string;
  requested_quantity: number;
  status: ResourceRequestStatus;
  title: string;
  assigned_to: UserReadMinimal | null;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  created_date: string;
  modified_date: string;
  related_patient: PatientRead | null;
}

export const RESOURCE_REQUEST_STATUS_COLORS = {
  pending: "yellow",
  approved: "green",
  rejected: "destructive",
  cancelled: "secondary",
  transportation_to_be_arranged: "secondary",
  transfer_in_progress: "secondary",
  completed: "secondary",
} as const;

export interface CreateResourceRequest {
  title: string;
  status: ResourceRequestStatus;
  reason: string;
  referring_facility_contact_name: string;
  referring_facility_contact_number: string;
  approving_facility: string | null;
  assigned_to: string | null;
  assigned_facility: string | null;
  origin_facility: string;
  related_patient: string;
  emergency: boolean;
  priority: number;
  category: string;
}

export interface UpdateResourceRequest {
  id: string;
  title: string;
  reason: string;
  assigned_to: string | null;
  status: ResourceRequestStatus;
  referring_facility_contact_name: string;
  referring_facility_contact_number: string;
  approving_facility: string | null;
  assigned_facility: string | null;
  origin_facility: string;
  related_patient: string;
  emergency: boolean;
  priority: number;
  category: string;
}

export interface CommentModel {
  id: string;
  created_by: UserBareMinimum;
  created_date: string;
  comment: string;
}
