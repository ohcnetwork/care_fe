import { PatientRead } from "@/types/emr/patient/patient";
import { FacilityRead } from "@/types/facility/facility";
import { UserReadMinimal } from "@/types/user/user";
import { valuesOf } from "@/Utils/utils";

export enum ResourceRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  TRANSPORTATION_TO_BE_ARRANGED = "transportation_to_be_arranged",
  TRANSFER_IN_PROGRESS = "transfer_in_progress",
  COMPLETED = "completed",
}

export const RESOURCE_REQUEST_COMPLETED_STATUSES = [
  ResourceRequestStatus.COMPLETED,
  ResourceRequestStatus.REJECTED,
  ResourceRequestStatus.CANCELLED,
] as const;

export const RESOURCE_REQUEST_ACTIVE_STATUSES = [
  ResourceRequestStatus.PENDING,
  ResourceRequestStatus.APPROVED,
  ResourceRequestStatus.TRANSPORTATION_TO_BE_ARRANGED,
  ResourceRequestStatus.TRANSFER_IN_PROGRESS,
] as const;

export const RESOURCE_REQUEST_STATUS_COLORS = {
  [ResourceRequestStatus.PENDING]: "yellow",
  [ResourceRequestStatus.APPROVED]: "green",
  [ResourceRequestStatus.REJECTED]: "destructive",
  [ResourceRequestStatus.CANCELLED]: "secondary",
  [ResourceRequestStatus.TRANSPORTATION_TO_BE_ARRANGED]: "secondary",
  [ResourceRequestStatus.TRANSFER_IN_PROGRESS]: "secondary",
  [ResourceRequestStatus.COMPLETED]: "secondary",
} as const;

export const RESOURCE_REQUEST_STATUS_OPTIONS = [
  { icon: "l-clock", text: ResourceRequestStatus.PENDING },
  { icon: "l-check", text: ResourceRequestStatus.APPROVED },
  { icon: "l-ban", text: ResourceRequestStatus.REJECTED },
  { icon: "l-file-slash", text: ResourceRequestStatus.CANCELLED },
  {
    icon: "l-truck",
    text: ResourceRequestStatus.TRANSPORTATION_TO_BE_ARRANGED,
  },
  { icon: "l-spinner", text: ResourceRequestStatus.TRANSFER_IN_PROGRESS },
  { icon: "l-check-circle", text: ResourceRequestStatus.COMPLETED },
] as const;

export enum ResourceRequestCategory {
  PATIENT_CARE = "patient_care",
  COMFORT_DEVICES = "comfort_devices",
  MEDICINES = "medicines",
  FINANCIAL = "financial",
  OTHER = "other",
}

export interface ResourceRequestBase {
  emergency: boolean;
  title: string;
  reason: string;
  referring_facility_contact_name: string;
  referring_facility_contact_number: string;
  status: ResourceRequestStatus;
  category: ResourceRequestCategory;
  priority: number;
}

export interface ResourceRequestListRead extends ResourceRequestBase {
  id: string;
  origin_facility: FacilityRead;
  assigned_facility: FacilityRead | null;
  created_date: string;
  modified_date: string;
}

export interface ResourceRequestRead extends ResourceRequestListRead {
  approving_facility: FacilityRead | null;
  related_patient: PatientRead | null;
  assigned_to: UserReadMinimal | null;
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
}

export interface ResourceRequestCreate extends ResourceRequestBase {
  origin_facility: string;
  approving_facility: string | null;
  assigned_facility: string | null;
  related_patient: string | null;
  assigned_to: string | null;
}

export interface CommentCreate {
  comment: string;
}

export interface CommentRead {
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
