import { UserBareMinimum } from "@/components/Users/models";

interface ReportBase {
  id?: string;
  name: string;
}

type ReportType = "discharge_summary" | "lab_report";

export interface ReportCreateModel extends ReportBase {
  file_type: ReportType;
  associating_id: string;
  original_name: string;
  mime_type: string | null;
}

export interface ReportList extends ReportBase {
  file_type: ReportType;
  associating_id: string;
  archived_by?: UserBareMinimum;
  archived_datetime?: string;

  upload_completed: boolean;
  is_archived?: boolean;
  archive_reason?: string;
  created_date: string;
  extension?: string;

  uploaded_by?: UserBareMinimum;
  mime_type?: string;
}

export interface ReportModel extends ReportList {
  signed_url?: string;
  read_signed_url?: string;
}
