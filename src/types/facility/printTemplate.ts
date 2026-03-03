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
  appointment = "appointment",
}
