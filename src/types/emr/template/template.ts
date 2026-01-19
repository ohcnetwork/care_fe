import { SlugConfig } from "@/types/base/slug/slugConfig";
import { FacilityBareMinimum } from "@/types/facility/facility";

export interface TemplateSchemaRead {
  contexts: Record<string, ContextSchema>;
  output_formats: Record<string, OutputFormatSchema>;
  custom_types: Record<string, CustomTypeConfig>;
  report_types: Record<string, ReportTypeConfig>;
}

export interface ContextSchema {
  slug: string;
  display_name: string;
  description: string;
  context_type: string;
  context_key: string;
  standalone: boolean;
  fields: FieldSchema[];
}

export interface FieldSchema {
  key: string;
  display: string;
  description: string;
  type: string;
  preview_value: string[] | Record<string, string[]> | string;
  is_nested_context?: boolean;
  nested_context_type?: string;
  fields?: FieldSchema[];
}

export interface OutputFormatSchema {
  format: string;
  generator: string;
  mime_type: string;
  file_extension: string;
  supported_options: Record<string, SupportedOptionConfig>;
}
export type SupportedOptionConfig = Record<
  string,
  {
    type: string;
    default: string;
    options?: string[];
  }
>;

export type CustomTypeConfig = {
  name: string;
  description: string;
  structure: Record<string, string>;
  example: Record<string, string>;
};

export interface ReportTypeConfig {
  display_name: string;
  description: string;
  supported_contexts: string[];
}

export const TemplateStatuses = ["draft", "active", "retired"] as const;
export type TemplateStatus = (typeof TemplateStatuses)[number];

export const TemplateFormats = ["html", "pdf"] as const;
export type TemplateFormat = (typeof TemplateFormats)[number];

export const TemplateTypes = [
  "discharge_summary",
  "patient_summary",
  "account_report",
] as const;
export type TemplateType = (typeof TemplateTypes)[number];
export interface TemplateBase {
  id: string;
  name: string;
  status: TemplateStatus;
  default_format: TemplateFormat;
  created_date: string;
  description: string;
}

export interface TemplateBaseRead extends TemplateBase {
  slug: string;
  slug_config: SlugConfig;
  template_type: string;
  context: string;
}

export interface TemplateRead extends TemplateBaseRead {
  template_data: string;
  facility?: FacilityBareMinimum;
  modified_date: string;
}

export interface TemplateCreate extends Omit<
  TemplateBase,
  "id" | "created_date"
> {
  slug_value: string;
  facility?: string;
  template_data: string;
  template_type: string;
  context: string;
}

export interface TemplatePreviewCreate {
  template_data: string;
  context: string;
  output_format: string;
}

export interface TemplatePreviewRead {
  html: string;
  validation: {
    syntax_valid: boolean;
    syntax_error: string | null;
    variables: string[];
    render_valid: boolean;
    render_error: string | null;
  };
}
