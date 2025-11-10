import { z } from "zod";

export interface Designation {
  language?: string;
  use?: {
    system: string;
    code: string;
  };
  value?: string;
}

export interface CodeConceptMinimal {
  code: string;
  display: string;
  system: string;
  designation: Designation[];
}

export interface Code {
  system: string;
  code: string;
  display: string;
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

/**
 * Helper function to check if a Code object is valid and has all required properties
 * @param code - The Code object to validate (can be null or undefined)
 * @returns true if code exists and has both system and code properties, false otherwise
 */
export function isCodePresent(code: Code | null | undefined): code is Code {
  return !!(code && code.system && code.code);
}
