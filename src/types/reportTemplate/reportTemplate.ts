import { FacilityModel } from "@/components/Facility/models";

import { UserBase } from "@/types/user/user";

export type AlignmentOptions =
  | "left"
  | "center"
  | "right"
  | "right + bottom"
  | "left + bottom"
  | "center + bottom"
  | "top+left"
  | "top+right"
  | "top+center";

export const ALIGNMENT_OPTIONS = [
  { id: "left", value: "Left" },
  { id: "center", value: "Center" },
  { id: "right", value: "Right" },
  { id: "right + bottom", value: "Right Bottom" },
  { id: "left + bottom", value: "Left Bottom" },
  { id: "center + bottom", value: "Center Bottom" },
  { id: "top+left", value: "Top Left" },
  { id: "top+right", value: "Top Right" },
  { id: "top+center", value: "Top Center" },
] as const;

interface Margins {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

interface PageMargin {
  mode: "uniform" | "custom";
  value?: string;
  values?: Margins;
}

interface PageNumbering {
  enabled: boolean;
  format: string;
  align: AlignmentOptions;
}

export const FONT_OPTIONS = [
  { id: "helvetica", value: "Helvetica" },
  { id: "arial", value: "Arial" },
  { id: "times-new-roman", value: "Times New Roman" },
  { id: "courier", value: "Courier" },
  { id: "verdana", value: "Verdana" },
  { id: "libertinus-serif", value: "Libertinus Serif" },
  { id: "new-computer-modern", value: "New Computer Modern" },
  { id: "new-computer-modern-math", value: "New Computer Modern Math" },
  { id: "dejavu-sans", value: "DejaVu Sans" },
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

export const REPORT_SIZE_OPTIONS = [
  { id: "a0", value: "A0" },
  { id: "a1", value: "A1" },
  { id: "a2", value: "A2" },
  { id: "a3", value: "A3" },
  { id: "a4", value: "A4" },
  { id: "a5", value: "A5" },
  { id: "a6", value: "A6" },
  { id: "a7", value: "A7" },
  { id: "a8", value: "A8" },
  { id: "a9", value: "A9" },
  { id: "a10", value: "A10" },
  { id: "a11", value: "A11" },
  { id: "iso-b1", value: "ISO B1" },
  { id: "iso-b2", value: "ISO B2" },
  { id: "iso-b3", value: "ISO B3" },
  { id: "iso-b4", value: "ISO B4" },
  { id: "iso-b5", value: "ISO B5" },
  { id: "iso-b6", value: "ISO B6" },
  { id: "iso-b7", value: "ISO B7" },
  { id: "iso-b8", value: "ISO B8" },
  { id: "iso-c3", value: "ISO C3" },
  { id: "iso-c4", value: "ISO C4" },
  { id: "iso-c5", value: "ISO C5" },
  { id: "iso-c6", value: "ISO C6" },
  { id: "iso-c7", value: "ISO C7" },
  { id: "iso-c8", value: "ISO C8" },
  { id: "din-d3", value: "DIN D3" },
  { id: "din-d4", value: "DIN D4" },
  { id: "din-d5", value: "DIN D5" },
  { id: "din-d6", value: "DIN D6" },
  { id: "din-d7", value: "DIN D7" },
  { id: "din-d8", value: "DIN D8" },
  { id: "sis-g5", value: "SIS G5" },
  { id: "sis-e5", value: "SIS E5" },
  { id: "ansi-a", value: "ANSI A" },
  { id: "ansi-b", value: "ANSI B" },
  { id: "ansi-c", value: "ANSI C" },
  { id: "ansi-d", value: "ANSI D" },
  { id: "ansi-e", value: "ANSI E" },
  { id: "arch-a", value: "ARCH A" },
  { id: "arch-b", value: "ARCH B" },
  { id: "arch-c", value: "ARCH C" },
  { id: "arch-d", value: "ARCH D" },
  { id: "arch-e1", value: "ARCH E1" },
  { id: "arch-e", value: "ARCH E" },
  { id: "jis-b0", value: "JIS B0" },
  { id: "jis-b1", value: "JIS B1" },
  { id: "jis-b2", value: "JIS B2" },
  { id: "jis-b3", value: "JIS B3" },
  { id: "jis-b4", value: "JIS B4" },
  { id: "jis-b5", value: "JIS B5" },
  { id: "jis-b6", value: "JIS B6" },
  { id: "jis-b7", value: "JIS B7" },
  { id: "jis-b8", value: "JIS B8" },
  { id: "jis-b9", value: "JIS B9" },
  { id: "jis-b10", value: "JIS B10" },
  { id: "jis-b11", value: "JIS B11" },
  { id: "sac-d0", value: "SAC D0" },
  { id: "sac-d1", value: "SAC D1" },
  { id: "sac-d2", value: "SAC D2" },
  { id: "sac-d3", value: "SAC D3" },
  { id: "sac-d4", value: "SAC D4" },
  { id: "sac-d5", value: "SAC D5" },
  { id: "sac-d6", value: "SAC D6" },
  { id: "iso-id-1", value: "ISO ID 1" },
  { id: "iso-id-2", value: "ISO ID 2" },
  { id: "iso-id-3", value: "ISO ID 3" },
  { id: "asia-f4", value: "ASIA F4" },
  { id: "jp-shiroku-ban-4", value: "JP SHIROKU BAN 4" },
  { id: "jp-shiroku-ban-5", value: "JP SHIROKU BAN 5" },
  { id: "jp-shiroku-ban-6", value: "JP SHIROKU BAN 6" },
  { id: "jp-kiku-4", value: "JP KIKU 4" },
  { id: "jp-kiku-5", value: "JP KIKU 5" },
  { id: "jp-business-card", value: "JP BUSINESS CARD" },
  { id: "cn-business-card", value: "CN BUSINESS CARD" },
  { id: "eu-business-card", value: "EU BUSINESS CARD" },
  { id: "fr-tellière", value: "FR TELLIÈRE" },
  { id: "fr-couronne-écriture", value: "FR COURONNE ÉCRITURE" },
  { id: "fr-couronne-édition", value: "FR COURONNE ÉDITION" },
  { id: "fr-raisin", value: "FR RAISIN" },
  { id: "fr-carré", value: "FR CARRÉ" },
  { id: "fr-jésus", value: "FR JÉSUS" },
  { id: "uk-brief", value: "UK BRIEF" },
  { id: "uk-draft", value: "UK DRAFT" },
  { id: "uk-foolscap", value: "UK FOOLSCAP" },
  { id: "uk-quarto", value: "UK QUARTO" },
  { id: "uk-crown", value: "UK CROWN" },
  { id: "uk-book-a", value: "UK BOOK A" },
  { id: "uk-book-b", value: "UK BOOK B" },
  { id: "us-letter", value: "US LETTER" },
  { id: "us-legal", value: "US LEGAL" },
  { id: "us-tabloid", value: "US TABLOID" },
  { id: "us-executive", value: "US EXECUTIVE" },
  { id: "us-foolscap-folio", value: "US FOOLSCAP FOLIO" },
  { id: "us-statement", value: "US STATEMENT" },
  { id: "us-ledger", value: "US LEDGER" },
  { id: "us-oficio", value: "US OFICIO" },
  { id: "us-gov-letter", value: "US GOV LETTER" },
  { id: "us-gov-legal", value: "US GOV LEGAL" },
  { id: "us-business-card", value: "US BUSINESS CARD" },
  { id: "us-digest", value: "US DIGEST" },
  { id: "us-trade", value: "US TRADE" },
  { id: "newspaper-compact", value: "NEWSPAPER COMPACT" },
  { id: "newspaper-berliner", value: "NEWSPAPER BERLINER" },
  { id: "newspaper-broadsheet", value: "NEWSPAPER BROADSHEET" },
  { id: "presentation-16-9", value: "PRESENTATION 16-9" },
  { id: "presentation-4-3", value: "PRESENTATION 4-3" },
];
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
  length: string;
  stroke: string;
}

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
  text?: string;
  rows?: Array<Array<string>>;
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
  id?: string;
  config: ReportConfig;
  slug: string;
  type: ReportTemplateType;
}

export type ReportTemplateCreate = Omit<ReportTemplateBase, "id">;

export type ReportTemplateUpdate = Omit<ReportTemplateCreate, "type" | "slug">;

export interface ReportTemplateModel extends ReportTemplateBase {
  facility: FacilityModel;
  created_by: UserBase;
  updated_by: UserBase;
}

export interface ReportTemplateGenerate {
  render_format: "typst";
  type: ReportTemplateType;
  slug: string;
  patient_external_id?: string;
}
