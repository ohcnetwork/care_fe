import { TemplateBase } from "@/types/emr/template/template";
import { UserBase, UserReadMinimal } from "@/types/user/user";

export interface ReportBase {
  id: string;
  name: string;
}

export interface ReportReadList extends ReportBase {
  template: Partial<TemplateBase>;
  report_type: string;
  associating_id: string;
  archived_by: UserBase;
  archived_datetime: string;
  archive_reason?: string;
  upload_completed: boolean;
  is_archived: boolean;
  created_date: string;
  extension: string;
  uploaded_by: UserReadMinimal;
  mime_type: string;
}

export interface ReportRead extends ReportReadList {
  signed_url: string;
  read_signed_url: string;
  internal_name: string;
}

export interface ReportGenerateCreate {
  template_id: string;
  associating_id: string;
  output_format: string;
  options: string;
  force: boolean;
}

export interface ReportDownloadRead {
  download_url: string;
  file_name: string;
  mime_type: string;
}

export interface ReportArchiveRead {
  detail: string;
  archived_datetime: string;
  archived_by: string;
}

export enum ReportType {
  DISCHARGE_SUMMARY = "discharge_summary",
  PATIENT_SUMMARY = "patient_summary",
  ACCOUNT_REPORT = "account_report",
}
