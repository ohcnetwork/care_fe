import { PatientRead } from "@/types/emr/patient/patient";
import { FacilityRead } from "@/types/facility/facility";
import { UserReadMinimal } from "@/types/user/user";
import { valuesOf } from "@/Utils/utils";

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
  category: ResourceRequestCategory;
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

export enum ResourceRequestCategory {
  PATIENT_CARE = "patient_care",
  COMFORT_DEVICES = "comfort_devices",
  MEDICINES = "medicines",
  FINANCIAL = "financial",
  OTHER = "other",
}

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
  category: ResourceRequestCategory;
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
  category: ResourceRequestCategory;
}

export interface CommentModel {
  id: string;
  created_by: UserReadMinimal;
  created_date: string;
  comment: string;
}

// converting to lowercase as old data in db are in uppercase and new are in lowercase
export const getResourceRequestCategoryEnum = (category: string) => {
  const categoryText = category.toLowerCase() as ResourceRequestCategory;
  if (valuesOf(ResourceRequestCategory).includes(categoryText)) {
    return categoryText;
  }
  return ResourceRequestCategory.OTHER;
};
