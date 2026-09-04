import { Designation } from "@/types/base/code/code";
import {
  ArchiveIcon,
  FileCheckIcon,
  HelpCircle,
  NotepadTextDashedIcon,
} from "lucide-react";

export enum ValueSetStatus {
  ACTIVE = "active",
  DRAFT = "draft",
  RETIRED = "retired",
  UNKNOWN = "unknown",
}

export const VALUESET_STATUS_COLORS = {
  [ValueSetStatus.ACTIVE]: "primary",
  [ValueSetStatus.DRAFT]: "yellow",
  [ValueSetStatus.RETIRED]: "destructive",
  [ValueSetStatus.UNKNOWN]: "secondary",
} as const;

export const VALUESET_STATUS_ICONS = {
  [ValueSetStatus.ACTIVE]: FileCheckIcon,
  [ValueSetStatus.DRAFT]: NotepadTextDashedIcon,
  [ValueSetStatus.RETIRED]: ArchiveIcon,
  [ValueSetStatus.UNKNOWN]: HelpCircle,
} as const;

export interface ValueSetFilter {
  op: string;
  value: string;
  property: string;
}

export interface ValueSetConcept {
  code: string;
  display: string;
}

export interface ValueSetInclude {
  filter?: ValueSetFilter[];
  system: string;
  version?: string;
  concept?: ValueSetConcept[];
}

interface ValueSetCompose {
  exclude: ValueSetInclude[];
  include: ValueSetInclude[];
}

export interface ValueSetBase {
  slug: string;
  name: string;
  description: string;
  compose: ValueSetCompose;
  status: ValueSetStatus;
  is_system_defined: boolean;
}

export interface ValueSetRead extends ValueSetBase {
  id: string;
  created_by: string | null;
  updated_by: string | null;
}

export type ValueSetCreate = ValueSetBase;

export interface ValueSetUpdate extends ValueSetBase {
  id: string;
}

export interface ExpandRequest {
  search: string;
  count: number;
}

export interface ValueSetCodeMetadata {
  code: string;
  display: string;
  name: string;
  system: string;
  version: string;
  inactive: boolean;
}

export interface DesignationItem {
  details: Designation;
  context: Record<string, unknown>;
}

export interface ValueSetLookupResponse {
  designations: DesignationItem[];
  metadata: ValueSetCodeMetadata;
  properties: Record<string, unknown>;
}

export interface ValueSetLookupRequest {
  system: string;
  code: string;
  version?: string;
}

export const TERMINOLOGY_SYSTEMS = {
  LOINC: "http://loinc.org",
  SNOMED: "http://snomed.info/sct",
  UCUM: "http://unitsofmeasure.org",
} as const;

export const SNOMED_VERSIONS = {
  INDIAN: "http://snomed.info/sct/1121000189102/version/20241129",
  INTERNATIONAL: "http://snomed.info/sct/900000000000207008/version/20241101",
} as const;

export type TerminologySystem = keyof typeof TERMINOLOGY_SYSTEMS;
