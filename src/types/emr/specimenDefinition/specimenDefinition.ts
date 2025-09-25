import { Code } from "@/types/base/code/code";
import { SlugConfig } from "@/types/base/slug/slugConfig";
import { UserReadMinimal } from "@/types/user/user";

export enum SpecimenDefinitionStatus {
  draft = "draft",
  active = "active",
  retired = "retired",
}

export const SPECIMEN_DEFINITION_STATUS_COLORS = {
  draft: "secondary",
  active: "primary",
  retired: "destructive",
} as const satisfies Record<SpecimenDefinitionStatus, string>;

export enum Preference {
  preferred = "preferred",
  alternate = "alternate",
}

export interface QuantitySpec {
  value: number;
  unit: Code;
}

export interface MinimumVolumeSpec {
  quantity?: QuantitySpec | null;
  string?: string;
}

export interface DurationSpec {
  value: number;
  unit: Code;
}

export interface ContainerSpec {
  description?: string;
  capacity?: QuantitySpec | null;
  minimum_volume?: MinimumVolumeSpec;
  cap?: Code;
  preparation?: string;
}

export const SPECIMEN_DEFINITION_UNITS_CODES = [
  {
    code: "mg",
    display: "milligram",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "g",
    display: "gram",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "mL",
    display: "milliliter",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "[drp]",
    display: "drop",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "ug",
    display: "microgram",
    system: "http://unitsofmeasure.org",
  },
] as const;

export const RETENTION_TIME_UNITS = [
  { code: "h", display: "hours", system: "http://unitsofmeasure.org" },
  { code: "d", display: "days", system: "http://unitsofmeasure.org" },
] as const;

export interface TypeTestedSpec {
  is_derived: boolean;
  preference: Preference;
  container?: ContainerSpec | null;
  requirement?: string;
  retention_time?: DurationSpec | null;
  single_use?: boolean | null;
}

export interface SpecimenDefinition {
  id: string;
  title: string;
  slug: string;
  derived_from_uri?: string;
  status: SpecimenDefinitionStatus;
  description: string;
  type_collected: Code;
  patient_preparation?: Code[];
  collection?: Code;
  slug_config: SlugConfig;
}

export interface SpecimenDefinitionCreate
  extends Omit<SpecimenDefinition, "id" | "facility" | "slug_config" | "slug"> {
  slug_value: string;
  type_tested?: TypeTestedSpec;
}

export interface SpecimenDefinitionRead extends SpecimenDefinition {
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  created_at: string;
  updated_at: string;
  type_tested?: TypeTestedSpec;
}
