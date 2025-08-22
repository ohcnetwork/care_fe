import { FacilityRead } from "@/types/facility/facility";
import { UserReadMinimal } from "@/types/user/user";

export type AlignmentOptions =
  | "left"
  | "center"
  | "right"
  | "top+left"
  | "top+right"
  | "top+center";

export const PAGE_NUMBER_POSITIONS = {
  TOP: {
    LEFT: "top+left",
    RIGHT: "top+right",
    CENTER: "top+center",
  },
  BOTTOM: {
    LEFT: "left",
    RIGHT: "right",
    CENTER: "center",
  },
} as const;

export const ALIGNMENT_OPTIONS = [
  { id: PAGE_NUMBER_POSITIONS.TOP.LEFT, value: "Top Left" },
  { id: PAGE_NUMBER_POSITIONS.TOP.RIGHT, value: "Top Right" },
  { id: PAGE_NUMBER_POSITIONS.TOP.CENTER, value: "Top Center" },
  { id: PAGE_NUMBER_POSITIONS.BOTTOM.LEFT, value: "Bottom Left" },
  { id: PAGE_NUMBER_POSITIONS.BOTTOM.RIGHT, value: "Bottom Right" },
  { id: PAGE_NUMBER_POSITIONS.BOTTOM.CENTER, value: "Bottom Center" },
] as const;

interface Margins {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export type PageMargin =
  | {
      mode: "uniform";
      value: string;
      values?: Margins;
    }
  | {
      mode: "custom";
      values: Margins;
      value?: string;
    };

interface PageNumbering {
  enabled: boolean;
  format: string;
  align: AlignmentOptions;
}

export const FONT_OPTIONS = [
  { id: "arial", value: "Arial" },
  { id: "times-new-roman", value: "Times New Roman" },
  { id: "courier", value: "Courier" },
  { id: "verdana", value: "Verdana" },
] as const;

export const FONT_SIZES = [
  { id: 8, value: "8pt" },
  { id: 10, value: "10pt" },
  { id: 12, value: "12pt" },
  { id: 14, value: "14pt" },
  { id: 16, value: "16pt" },
  { id: 18, value: "18pt" },
  { id: 20, value: "20pt" },
  { id: 24, value: "24pt" },
] as const;

interface TextConfig {
  font: string;
  size: string;
}

// Paper margin configurations by category
const PAPER_MARGINS = {
  STANDARD: {
    mode: "custom",
    values: { top: "40", right: "30", bottom: "40", left: "30" },
  },
  BUSINESS_CARD: {
    mode: "uniform",
    value: "12",
  },
  PRESENTATION: {
    mode: "custom",
    values: { top: "48", right: "54", bottom: "48", left: "54" },
  },
} as const;

export const REPORT_SIZE_OPTIONS = [
  {
    id: "a4",
    value: "A4",
    margins: PAPER_MARGINS.STANDARD,
    dimensions: { width: 595, height: 842 },
  },
  {
    id: "a5",
    value: "A5",
    margins: PAPER_MARGINS.STANDARD,
    dimensions: { width: 420, height: 595 },
  },
  {
    id: "us-letter",
    value: "Letter",
    margins: PAPER_MARGINS.STANDARD,
    dimensions: { width: 612, height: 792 },
  },
  {
    id: "us-legal",
    value: "Legal",
    margins: PAPER_MARGINS.STANDARD,
    dimensions: { width: 612, height: 1008 },
  },
  {
    id: "business-card",
    value: "Business Card",
    margins: PAPER_MARGINS.BUSINESS_CARD,
    dimensions: { width: 252, height: 144 },
  },
  {
    id: "presentation-16-9",
    value: "Presentation 16:9",
    margins: PAPER_MARGINS.PRESENTATION,
    dimensions: { width: 1920, height: 1080 },
  },
  {
    id: "presentation-4-3",
    value: "Presentation 4:3",
    margins: PAPER_MARGINS.PRESENTATION,
    dimensions: { width: 1024, height: 768 },
  },
] as const;

// Add type for report size option
export type ReportSizeOption = (typeof REPORT_SIZE_OPTIONS)[number];

interface Layout {
  page_size: string;
  page_margin: PageMargin;
  page_numbering: PageNumbering;
  text: TextConfig;
}

interface StyleConfig {
  fill?: string;
  weight?: number;
}

export type HeaderAlignment = "left" | "center" | "right";

export const HEADER_ALIGNMENT_OPTIONS = [
  { id: "left", value: "Left" },
  { id: "center", value: "Center" },
  { id: "right", value: "Right" },
] as const;

interface BaseHeaderElement {
  align?: HeaderAlignment;
}

interface TextElement extends BaseHeaderElement {
  type: "text";
  text: string;
  size: string;
  weight: number;
}

interface ImageElement extends BaseHeaderElement {
  type: "image";
  file_name: string;
  url: string;
  width: string;
}

interface RuleElement extends BaseHeaderElement {
  type: "rule";
  length: number;
  stroke: string;
}

export const DateFormats = {
  "DD/MM/YYYY": "[day]/[month]/[year]",
  "MM/DD/YYYY": "[month]/[day]/[year]",
  "YYYY/MM/DD": "[year]/[month]/[day]",
  "DD-MM-YYYY": "[day]-[month]-[year]",
  "MM-DD-YYYY": "[month]-[day]-[year]",
  "YYYY-MM-DD": "[year]-[month]-[day]",
  "YYYY-DD-MM": "[year]-[day]-[month]",
  "DD/MM/YYYY hh:mm": "[day]/[month]/[year] [hour]:[minute]",
  "MM/DD/YYYY hh:mm": "[month]/[day]/[year] [hour]:[minute]",
  "YYYY/MM/DD hh:mm": "[year]/[month]/[day] [hour]:[minute]",
  "DD-MM-YYYY hh:mm": "[day]-[month]-[year] [hour]:[minute]",
  "MM-DD-YYYY hh:mm": "[month]-[day]-[year] [hour]:[minute]",
  "YYYY-MM-DD hh:mm": "[year]-[month]-[day] [hour]:[minute]",
  "YYYY-DD-MM hh:mm": "[year]-[day]-[month] [hour]:[minute]",
  "DD/MM/YYYY hh:mm:ss": "[day]/[month]/[year] [hour]:[minute]:[second]",
  "MM/DD/YYYY hh:mm:ss": "[month]/[day]/[year] [hour]:[minute]:[second]",
  "YYYY/MM/DD hh:mm:ss": "[year]/[month]/[day] [hour]:[minute]:[second]",
  "DD-MM-YYYY hh:mm:ss": "[day]-[month]-[year] [hour]:[minute]:[second]",
  "MM-DD-YYYY hh:mm:ss": "[month]-[day]-[year] [hour]:[minute]:[second]",
  "YYYY-MM-DD hh:mm:ss": "[year]-[month]-[day] [hour]:[minute]:[second]",
  "YYYY-DD-MM hh:mm:ss": "[year]-[day]-[month] [hour]:[minute]:[second]",
} as const;

interface DateTimeElement extends BaseHeaderElement {
  type: "datetime";
  label: string;
  format: string;
  style: StyleConfig;
}

export type HeaderElementType =
  | TextElement
  | ImageElement
  | RuleElement
  | DateTimeElement;

export interface HeaderRow {
  size_ratio?: number[];
  columns: HeaderElementType[];
}

export interface HeaderConfig {
  rows: HeaderRow[];
}

export const FONT_WEIGHT_OPTIONS = [
  { id: 400, value: "Normal" },
  { id: 500, value: "Medium" },
  { id: 600, value: "Semibold" },
  { id: 700, value: "Bold" },
  { id: 800, value: "Extra bold" },
] as const;

interface LabelValueField {
  label: string;
  value: string;
}

export interface SectionOptions {
  title?: string;
  fields?: string[] | Array<LabelValueField>;
  columns?: string[];
  style?: "list" | "text";
  filters?: Record<string, string[]>;
  text?: string[];
  rows?: Array<Array<string>>;
  count?: number;
  separator?: string;
}

export interface SectionConfig {
  source: string;
  is_table: boolean;
  enabled: boolean;
  options: SectionOptions;
}

export interface ReportConfig {
  layout: Layout;
  header: HeaderConfig;
  sections: SectionConfig[];
}

export const REPORT_TEMPLATE_TYPE = [
  { id: "discharge_summary", value: "Discharge Summary" },
  { id: "lab_report", value: "Lab Report" },
] as const;

export type ReportTemplateType = (typeof REPORT_TEMPLATE_TYPE)[number]["id"];

export interface ReportTemplateBase {
  id: string;
  config: ReportConfig;
  slug: string;
  type: ReportTemplateType;
}

export type ReportTemplateCreate = Omit<ReportTemplateBase, "id"> & {
  facility?: string;
  derived_from_url?: string;
};

export type ReportTemplateUpdate = Pick<ReportTemplateBase, "config">;

export interface ReportTemplateModel extends ReportTemplateBase {
  facility: FacilityRead;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  derived_from_url?: string;
}

export interface ReportTemplateGenerate {
  render_format?: "typst";
  type: ReportTemplateType;
  slug: string;
  patient_external_id?: string;
  facility?: string;
}

export const SECTION_DISPLAY_NAMES: Record<string, string> = {
  diagnosis: "section_diagnosis",
  symptoms: "section_symptom",
  allergy_intolerance: "section_allergy",
  observation: "section_observation",
  medication_request: "section_medication",
  patient_info: "section_patient_info",
  care_team: "section_care_team",
  file_upload: "section_file_upload",
  encounter: "section_encounter",
  discharge_summary_advice: "section_discharge_advice",
  custom_section: "section_custom",
} as const;
