import { UserReadMinimal } from "@/types/user/user";

export interface FileUploadQuestion {
  original_name: string;
  file_data: File;
  name: string;
  associating_id: string;
  file_type: string;
  file_category: string;
}

export enum FileCategory {
  UNSPECIFIED = "unspecified",
  XRAY = "xray",
  AUDIO = "audio",
  IDENTITY_PROOF = "identity_proof",
  CONSENT_ATTACHMENT = "consent_attachment",
  DISCHARGE_SUMMARY = "discharge_summary",
}

export enum FileType {
  PATIENT = "patient",
  ENCOUNTER = "encounter",
  CONSENT = "consent",
  DIAGNOSTIC_REPORT = "diagnostic_report",
  SERVICE_REQUEST = "service_request",
}

export interface FileBase {
  name: string;
  file_type: FileType;
  file_category: FileCategory;
  associating_id: string;
  mime_type: string;
}

export interface FileCreate extends FileBase {
  original_name: string;
}

export interface FileUpdate {
  id: string;
  name: string;
}

export interface FileReadMinimal extends FileBase {
  id: string;
  archived_by: UserReadMinimal;
  archived_datetime: string;
  upload_completed: boolean;
  is_archived?: boolean;
  archive_reason?: string;
  created_date: string;
  uploaded_by: UserReadMinimal;
  extension: string;
}

export interface FileRead extends FileReadMinimal {
  signed_url: string;
  read_signed_url: string;
  internal_name: string;
}
