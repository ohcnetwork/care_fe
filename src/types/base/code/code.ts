import { z } from "zod";
export interface Designation {
  language: string;
  use: Code;
  value: string;
}

export const DEFAULT_EXPAND_REQUEST_LANGUAGE = "en-gb";

export interface Code {
  system: string;
  code: string;
  display: string;
  designation?: Designation[];
}

export const CodeSchema = z.object({
  system: z.string(),
  code: z.string(),
  display: z.string(),
});

export type ValueSetSystem =
  | "system-allergy-code"
  | "system-condition-code"
  | "system-medication"
  | "system-additional-instruction"
  | "system-administration-method"
  | "system-as-needed-reason"
  | "system-body-site"
  | "system-route"
  | "system-observation"
  | "system-body-site-observation"
  | "system-collection-method"
  | "system-ucum-units";
