/**
 * FHIR R4 ValueSet Resource Type Definitions
 * Based on: https://www.hl7.org/fhir/valueset.html
 */

export interface FHIRValueSetConcept {
  code: string;
  display: string;
  designation?: FHIRDesignation[];
}

export interface FHIRDesignation {
  language?: string;
  use?: FHIRCoding;
  value: string;
}

export interface FHIRCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
}

export interface FHIRValueSetFilter {
  property: string;
  op: string;
  value: string;
}

export interface FHIRValueSetInclude {
  system: string;
  version?: string;
  concept?: FHIRValueSetConcept[];
  filter?: FHIRValueSetFilter[];
  valueSet?: string[];
}

export interface FHIRValueSetCompose {
  lockedDate?: string;
  inactive?: boolean;
  include: FHIRValueSetInclude[];
  exclude?: FHIRValueSetInclude[];
}

export interface FHIRValueSetExpansion {
  identifier?: string;
  timestamp: string;
  total?: number;
  offset?: number;
  parameter?: FHIRValueSetParameter[];
  contains?: FHIRValueSetContains[];
}

export interface FHIRValueSetParameter {
  name: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueDecimal?: number;
  valueUri?: string;
  valueCode?: string;
  valueDateTime?: string;
}

export interface FHIRValueSetContains {
  system?: string;
  abstract?: boolean;
  inactive?: boolean;
  version?: string;
  code?: string;
  display?: string;
  designation?: FHIRDesignation[];
  contains?: FHIRValueSetContains[];
}

export type FHIRValueSetStatus = "draft" | "active" | "retired" | "unknown";

export interface FHIRValueSet {
  resourceType: "ValueSet";
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
    profile?: string[];
  };
  url?: string;
  identifier?: Array<{
    system?: string;
    value: string;
  }>;
  version?: string;
  name: string;
  title?: string;
  status: FHIRValueSetStatus;
  experimental?: boolean;
  date?: string;
  publisher?: string;
  contact?: Array<{
    name?: string;
    telecom?: Array<{
      system?: string;
      value?: string;
    }>;
  }>;
  description?: string;
  useContext?: Array<{
    code: FHIRCoding;
    valueCodeableConcept?: {
      coding?: FHIRCoding[];
      text?: string;
    };
  }>;
  jurisdiction?: Array<{
    coding?: FHIRCoding[];
    text?: string;
  }>;
  immutable?: boolean;
  purpose?: string;
  copyright?: string;
  compose?: FHIRValueSetCompose;
  expansion?: FHIRValueSetExpansion;
}

export interface FHIRValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface FHIRValidationResult {
  isValid: boolean;
  errors: FHIRValidationError[];
  warnings: FHIRValidationError[];
}
