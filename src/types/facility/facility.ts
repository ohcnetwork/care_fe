import { Code } from "@/types/base/code/code";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";
import { Organization } from "@/types/organization/organization";
import { PatientIdentifierConfig } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

export interface FacilityBareMinimum {
  id: string;
  name: string;
}

export interface BaseFacility {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone_number?: string;
  facility_type: string;
  read_cover_image_url?: string;
  cover_image_url?: string;
  features: number[];
  geo_organization?: string;
  is_public: boolean;
  permissions: string[];
}

export type CreateFacility = Omit<BaseFacility, "id" | "permissions">;

export interface FacilityData {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone_number: string;
  facility_type: string;
  read_cover_image_url?: string;
  features: number[];
  geo_organization: Organization;
  latitude: number;
  longitude: number;
  pincode: number;
  is_public: boolean;
  permissions: string[];
  root_org_permissions: string[];
  child_org_permissions: string[];
  instance_discount_codes: Code[];
  instance_discount_monetary_components: MonetaryComponentRead[];
  instance_informational_codes: Code[];
  instance_tax_codes: Code[];
  instance_tax_monetary_components: MonetaryComponentRead[];
  invoice_number_expression: string;
  discount_codes: Code[];
  discount_monetary_components: MonetaryComponentRead[];
  patient_instance_identifier_configs: PatientIdentifierConfig[];
  patient_facility_identifier_configs: PatientIdentifierConfig[];
}
