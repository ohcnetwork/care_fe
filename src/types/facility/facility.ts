import { Code } from "@/types/base/code/code";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";
import { Organization } from "@/types/organization/organization";
import { PatientIdentifierConfig } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

export interface FacilityBareMinimum {
  id: string;
  name: string;
}

export interface FacilityBase extends FacilityBareMinimum {
  description: string;
  address: string;
  phone_number: string;
  facility_type: string;
  is_public: boolean;
  latitude?: number;
  longitude?: number;
  middleware_address?: string;
}

export interface FacilityRead
  extends Omit<FacilityBase, "geo_organization" | "latitude" | "longitude"> {
  id: string;
  read_cover_image_url?: string;
  cover_image_url?: string;
  permissions: string[];
  created_date?: string;
  modified_date?: string;
  geo_organization: Organization;
  latitude?: string;
  longitude?: string;
  pincode: number;
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
  features: number[];
}

export interface FacilityCreate extends Omit<FacilityBase, "id"> {
  geo_organization: string;
  features: number[];
}
