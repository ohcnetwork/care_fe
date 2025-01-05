import { FileUploadModel } from "@/components/Patient/models";
import { UserBareMinimum } from "@/components/Users/models";

import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
  UserRole,
} from "@/common/constants";

import { FeatureFlag } from "@/Utils/featureFlags";
import { PatientModel } from "@/types/emr/patient";

export interface FacilityModel {
  id?: string;
  name?: string;
  read_cover_image_url?: string;
  facility_type?: string;
  address?: string;
  features?: number[];
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  phone_number?: string;
  middleware_address?: string;
  modified_date?: string;
  created_date?: string;
  geo_organization?: string;
  pincode?: string;
  facility_flags?: FeatureFlag[];
  latitude?: string;
  longitude?: string;
  is_public?: boolean;
}

export interface OptionsType {
  id: number;
  text: string;
  disabled?: boolean;
}

export type PatientCategory =
  | "Comfort Care" // Discontinued
  | "Mild"
  | "Moderate"
  | "Critical"
  | "Actively Dying";

export interface PatientConsentModel {
  id: string;
  type: (typeof CONSENT_TYPE_CHOICES)[number]["id"];
  patient_code_status:
    | (typeof CONSENT_PATIENT_CODE_STATUS_CHOICES)[number]["id"]
    | null;
  files: FileUploadModel[] | null;
  archived: boolean;
  archived_by?: UserBareMinimum;
  archived_date: string;
  created_date: string;
  created_by: UserBareMinimum;
}

export interface DupPatientModel {
  id: string;
  gender: string;
  phone_number: string;
  patient_id: string;
  name: string;
  date_of_birth: string;
  year_of_birth: number;
  is_expired: boolean;
}

export interface InventoryItemsModel {
  // count?: number;
  id?: number;
  name?: string;
  default_unit?: {
    id: number;
    name: string;
  };
  allowed_units?: [
    {
      id: number;
      name: string;
    },
  ];
}

export interface FacilityType {
  id: number;
  name: string;
}

export interface BaseUserModel {
  id: number;
  first_name: string;
  username: string;
  email: string;
  last_name: string;
  user_type: string;
  last_login: string;
}

export interface PatientNotesEditModel {
  id: string;
  edited_by: BaseUserModel;
  edited_date: string;
  note: string;
}

export interface PaitentNotesReplyModel {
  id: string;
  note: string;
  user_type?: UserRole | "RemoteSpecialist";
  created_by_object: BaseUserModel;
  created_date: string;
}

export type IFacilityNotificationRequest = {
  facility: string;
  message: string;
};

export type IFacilityNotificationResponse = {
  [key: string]: string;
};

export type IUserFacilityRequest = {
  facility: string;
};

export type FacilityRequest = Omit<FacilityModel, "location" | "id">;

export type InventorySummaryResponse = {
  id: string;
  item_object: {
    id: number;
    default_unit: {
      id: number;
      name: string;
    };
    allowed_units: {
      id: number;
      name: string;
    }[];
    tags: {
      id: number;
      name: string;
    }[];
    name: string;
    description: string;
    min_quantity: number;
  };
  unit_object: {
    id: number;
    name: string;
  };
  created_date: string;
  quantity: number;
  is_low: boolean;
  item: number;
};

export type MinimumQuantityItemResponse = {
  id: string;
  item_object: InventoryItemsModel;
  created_date: string;
  min_quantity: number;
  item: number;
};

export type InventoryLogResponse = InventorySummaryResponse & {
  external_id: string;
  current_stock: number;
  quantity_in_default_unit: number;
  is_incoming: boolean;
  probable_accident: boolean;
  unit: number;
  created_by: number;
};

export type PatientTransferRequest = {
  phone_number: string;
  year_of_birth: string;
};

export interface ResourceModel {
  approving_facility: string | null;
  approving_facility_object: FacilityModel | null;
  assigned_facility: string | null;
  assigned_facility_object: FacilityModel | null;
  assigned_quantity: number;
  assigned_to: string | null;
  category: string;
  created_by: number;
  emergency: boolean;
  id: string;
  is_assigned_to_user: boolean;
  last_edited_by: number;
  modified_date: string;
  origin_facility: string;
  origin_facility_object: FacilityModel;
  priority: number;
  reason: string;
  referring_facility_contact_name: string;
  referring_facility_contact_number: string;
  requested_quantity: number;
  status: string;
  sub_category: string;
  title: string;
  assigned_to_object: UserBareMinimum | null;
  created_by_object: UserBareMinimum | null;
  created_date: string;
  last_edited_by_object: UserBareMinimum;
  related_patient_object: PatientModel | null;
}

export interface CommentModel {
  id: string;
  created_by_object: UserBareMinimum;
  created_date: string;
  modified_date: string;
  comment: string;
  created_by: number;
}
