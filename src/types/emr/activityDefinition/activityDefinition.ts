import { Code } from "@/types/base/code/code";
import { ResourceCategoryRead } from "@/types/base/resourceCategory/resourceCategory";
import { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import { LocationList } from "@/types/location/location";

export enum Status {
  draft = "draft",
  active = "active",
  retired = "retired",
  unknown = "unknown",
}

export const ACTIVITY_DEFINITION_STATUS_COLORS = {
  draft: "secondary",
  active: "primary",
  retired: "destructive",
  unknown: "outline",
} as const satisfies Record<Status, string>;

export enum Classification {
  laboratory = "laboratory",
  imaging = "imaging",
  surgical_procedure = "surgical_procedure",
  counselling = "counselling",
}

export enum Kind {
  service_request = "service_request",
}

export interface BaseActivityDefinitionSpec {
  id: string;
  slug: string;
  title: string;
  derived_from_uri: string | null;
  status: Status;
  description: string;
  usage: string;
  classification: Classification;
  kind: Kind;
  code: Code;
  body_site: Code | null;
  diagnostic_report_codes: Code[];
}

export interface ActivityDefinitionCreateSpec
  extends Omit<BaseActivityDefinitionSpec, "id"> {
  facility: string;
  specimen_requirements: string[];
  charge_item_definitions: string[];
  observation_result_requirements: string[];
  locations: string[];
  category: string;
  healthcare_service: string | null;
}

export interface ActivityDefinitionUpdateSpec
  extends Omit<BaseActivityDefinitionSpec, "category"> {
  facility: string;
  specimen_requirements: string[];
  charge_item_definitions: string[];
  observation_result_requirements: string[];
  locations: string[];
  category: string;
  healthcare_service: string | null;
}

export interface ActivityDefinitionReadSpec extends BaseActivityDefinitionSpec {
  version?: number;
  specimen_requirements: SpecimenDefinitionRead[];
  charge_item_definitions: ChargeItemDefinitionRead[];
  observation_result_requirements: ObservationDefinitionReadSpec[];
  locations: LocationList[];
  category: ResourceCategoryRead;
  healthcare_service: HealthcareServiceReadSpec;
}
