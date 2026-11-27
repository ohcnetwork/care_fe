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
  value: string;
  unit: Code;
}

export interface MinimumVolumeSpec {
  quantity?: QuantitySpec | null;
  string?: string;
}

export interface DurationSpec {
  value: string;
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

/** Defaults applied to a specimen when it is collected. */
export interface SpecimenCollectionTemplate {
  code?: Code | null;
  quantity?: QuantitySpec | null;
  method?: Code | null;
  body_site?: Code | null;
}

// The API uses a decimal string with at most 20 whole digits, beyond JS number precision.
export function wholeSpecimenQuantity(value: string) {
  return /^0*([1-9]\d{0,19})(?:\.0*)?$/.exec(value)?.[1];
}

export function specimenCollectionDefaults(
  template: SpecimenCollectionTemplate | null | undefined,
) {
  const quantity = template?.quantity;
  const value = quantity && wholeSpecimenQuantity(quantity.value);
  return {
    method: template?.method ?? null,
    body_site: template?.body_site ?? null,
    quantity: value && quantity?.unit ? { value, unit: quantity.unit } : null,
  };
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
  collection?: SpecimenCollectionTemplate | null;
  slug_config: SlugConfig;
}

export interface SpecimenDefinitionCreate extends Omit<
  SpecimenDefinition,
  "id" | "facility" | "slug_config" | "slug"
> {
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
