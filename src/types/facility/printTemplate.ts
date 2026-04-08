export interface PageMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PageConfig {
  size?: "A4" | "A5" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  margin?: PageMargin;
}

export interface PrintSetupConfig {
  auto_print?: boolean;
}

export interface LogoConfig {
  url: string;
  width?: number;
  height?: number;
  alignment: "left" | "center" | "right";
}

export interface ImageConfig {
  url: string;
  height?: number;
}

export interface BrandingConfig {
  logo?: LogoConfig;
  header_image?: ImageConfig;
  footer_image?: ImageConfig;
}

export interface WatermarkConfig {
  enabled?: boolean;
  text?: string;
  opacity?: number;
  rotation?: number;
}

export interface PrintTemplate {
  slug: string;
  page?: PageConfig;
  print_setup?: PrintSetupConfig;
  branding?: BrandingConfig;
  watermark?: WatermarkConfig;
}

export enum PrintTemplateType {
  default = "default",
  invoice = "invoice",
  invoices = "multi_invoice",
  appointment = "appointment",
  appointments = "appointments_list",
  prescription = "prescription",
  charge_items = "charge_items",
  payment_receipt = "payment_receipt",
  request_order = "request_order",
  delivery_order = "delivery_order",
  dispense_order = "dispense_order",
  medication_return = "medication_return",
  medication_administration = "medication_administration",
  diagnostic_report = "diagnostic_report",
  questionnaire_response_logs = "questionnaire_response_logs",
  treatment_summary = "treatment_summary",
  resource_letter = "resource_letter",
}
