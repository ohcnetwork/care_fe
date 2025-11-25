import { ContextConfig, TemplateBase } from "@/types/emr/template/template";
import { UserReadMinimal } from "@/types/user/user";

export interface ReportTypeRead {
  [key: string]: {
    display_name: string;
    description: string;
    associating_model: string;
  };
}

export interface ReportBase {
  id: string;
  name: string;
}

export interface ReportReadList extends ReportBase {
  template: Partial<TemplateBase>;
  report_type: string;
  associating_id: string;
  archived_by: UserReadMinimal;
  archived_datetime: string;
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

export interface ReportUpdate extends Omit<ReportBase, "id"> {
  name: string;
}

export interface ReportGenerateCreate {
  template_id: string;
  report_type: string;
  encounter_id?: string;
  patient_id?: string;
  associating_id: string;
  context_config: Record<string, ContextConfig> | null;
  output_format: string;
  options: Record<string, string>;
}

export interface ReportGenerateRead
  extends Omit<
    ReportRead,
    "template" | "upload_completed" | "is_archived" | "created_date" | "meta"
  > {
  template_id: string;
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
