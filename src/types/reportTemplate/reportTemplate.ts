import { FacilityModel } from "@/components/Facility/models";

import { UserBase } from "@/types/user/user";

type AlignmentOptions =
  | "left"
  | "center"
  | "right"
  | "right + bottom"
  | "left + bottom"
  | "center + bottom"
  | "top+left"
  | "top+right"
  | "top+center";

interface PageMargin {
  mode: string;
  value: string;
}

interface PageNumbering {
  enabled: boolean;
  format: string;
  align: AlignmentOptions;
}

interface ReportText {
  font: string;
  size: string;
}

interface ReportLayout {
  page_size: string;
  page_margin: PageMargin;
  page_numbering: PageNumbering;
  text: ReportText;
}

interface FacilityHeading {
  align: "left" | "center" | "right";
  size: string;
  weight: string;
}

interface Divider {
  length: string;
  stroke: string;
}

interface SummaryTitle {
  text: string;
  size: string;
}

interface LogoConfig {
  file_name: string;
}

type StyleType = "fill" | "weight";

type Style = Record<StyleType, string | number>;

interface CreatedOn {
  label: string;
  style: Style;
  date_format: string;
}

interface ReportHeader {
  facility_name: string;
  facility_heading: FacilityHeading;
  divider: Divider;
  title: SummaryTitle;

  logo: LogoConfig;

  created_on: CreatedOn;
}

interface SectionOptions {
  title?: string;
  fields?: string[];
  columns?: string[];
  style: "list" | "text";
  filters?: Record<string, string[]>;
}

interface SectionConfig {
  source: string;
  is_table: boolean;
  enabled: boolean;
  options: SectionOptions;
}

export interface ReportConfig {
  layout: ReportLayout;
  header: ReportHeader;
  sections: SectionConfig[];
}

export const REPORT_TEMPLATE_TYPE = [
  { id: "discharge_summary", value: "discharge_summary" },
  { id: "lab_report", value: "lab_report" },
] as const;

export type ReportTemplateType = (typeof REPORT_TEMPLATE_TYPE)[number]["id"];

export interface ReportTemplateCreate {
  id: string;
  config: ReportConfig;
  type: ReportTemplateType;
}

export type ReportTemplateUpdate = Omit<ReportTemplateCreate, "type">;

export interface ReportTemplateModel extends ReportTemplateCreate {
  facility: FacilityModel;
  created_by: UserBase;
  updated_by: UserBase;
}
