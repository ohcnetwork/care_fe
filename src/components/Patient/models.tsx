import { UserBareMinimum } from "@/components/Users/models";

import {
  DOMESTIC_HEALTHCARE_SUPPORT_CHOICES,
  OCCUPATION_TYPES,
  SOCIOECONOMIC_STATUS_CHOICES,
} from "@/common/constants";

export interface AssignedToObjectModel {
  first_name: string;
  last_name: string;
  last_login?: string;
  alt_phone_number?: string;
  user_type: string;
}

export interface PatientMeta {
  readonly id: number;
  occupation?: Occupation;
  socioeconomic_status?: (typeof SOCIOECONOMIC_STATUS_CHOICES)[number];
  domestic_healthcare_support?: (typeof DOMESTIC_HEALTHCARE_SUPPORT_CHOICES)[number];
}

// File Upload Models

export type FileCategory =
  | "unspecified"
  | "xray"
  | "audio"
  | "identity_proof"
  | "consent_attachment";

export interface CreateFileRequest {
  file_type: string | number;
  file_category: FileCategory;
  name: string;
  associating_id: string;
  original_name: string;
  mime_type: string;
}

export interface CreateFileResponse {
  id: string;
  file_type: string;
  file_category: FileCategory;
  signed_url: string;
  internal_name: string;
}

export interface FileUploadModel {
  id?: string;
  name?: string;
  associating_id?: string;
  created_date?: string;
  upload_completed?: boolean;
  uploaded_by?: UserBareMinimum;
  file_category?: FileCategory;
  read_signed_url?: string;
  is_archived?: boolean;
  archive_reason?: string;
  extension?: string;
  archived_by?: UserBareMinimum;
  mime_type?: string;
  archived_datetime?: string;
}

export type Occupation = (typeof OCCUPATION_TYPES)[number]["value"];
