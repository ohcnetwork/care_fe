export interface ValuesetFilter {
  op: string;
  value: string;
  property: string;
}

export interface ValuesetConcept {
  code: string;
  display: string;
}

export interface ValuesetInclude {
  filter?: ValuesetFilter[];
  system: string;
  concept?: ValuesetConcept[];
}

interface ValuesetCompose {
  exclude: ValuesetInclude[];
  include: ValuesetInclude[];
}

export interface ValuesetBase {
  id: string;
  slug: string;
  name: string;
  description: string;
  compose: ValuesetCompose;
  status: "active" | "inactive";
  is_system_defined: boolean;
  created_by: string | null;
  updated_by: string | null;
}

export type CreateValuesetModel = Omit<
  ValuesetBase,
  "id" | "created_by" | "updated_by"
>;

export type UpdateValuesetModel = CreateValuesetModel & {
  id: string;
};

export type ValuesetFormType = CreateValuesetModel;

export interface ValuesetCodeMetadata {
  code: string;
  display: string;
  name: string;
  system: string;
  version: string;
  inactive: boolean;
}

export interface ValuesetLookupResponse {
  metadata: ValuesetCodeMetadata;
}

export interface ValuesetLookupRequest {
  system: string;
  code: string;
}

export const TERMINOLOGY_SYSTEMS = {
  LOINC: "http://loinc.org",
  SNOMED: "http://snomed.info/sct",
  UCUM: "http://unitsofmeasure.org",
} as const;

export type TerminologySystem = keyof typeof TERMINOLOGY_SYSTEMS;
