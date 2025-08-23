import { Code } from "@/types/base/code/code";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { ObservationRead } from "@/types/emr/observation/observation";
import { UserReadMinimal } from "@/types/user/user";

export enum DiagnosticReportStatus {
  registered = "registered",
  partial = "partial",
  preliminary = "preliminary",
  modified = "modified",
  final = "final",
}

export const DIAGNOSTIC_REPORT_STATUS_COLORS = {
  registered: "secondary",
  partial: "yellow",
  preliminary: "blue",
  modified: "orange",
  final: "green",
} as const satisfies Record<DiagnosticReportStatus, string>;

export interface DiagnosticReportBase {
  id: string;
  status: DiagnosticReportStatus;
  category: Code;
  code?: Code;
  note?: string;
  conclusion?: string;
}

export interface DiagnosticReportCreate
  extends Omit<DiagnosticReportBase, "id"> {
  service_request: string;
}

export interface DiagnosticReportUpdate
  extends Omit<DiagnosticReportBase, "id"> {
  id: string;
}

export interface DiagnosticReportRead extends Omit<DiagnosticReportBase, "id"> {
  id: string;
  encounter: EncounterRead;
  observations: ObservationRead[];
  created_by: UserReadMinimal;
  created_date: string;
  modified_date: string;
  updated_by: UserReadMinimal;
}
