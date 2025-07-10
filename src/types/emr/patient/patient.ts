import { UserBareMinimum } from "@/components/Users/models";

import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { Organization } from "@/types/organization/organization";
import { PatientIdentifier } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

export enum BloodGroupChoices {
  A_negative = "A_negative",
  A_positive = "A_positive",
  B_negative = "B_negative",
  B_positive = "B_positive",
  AB_negative = "AB_negative",
  AB_positive = "AB_positive",
  O_negative = "O_negative",
  O_positive = "O_positive",
  Unknown = "unknown",
}

export type GenderChoices = "male" | "female" | "non_binary" | "transgender";

export interface PatientIdentifierCreate {
  config: string;
  value: string;
}

export interface Patient {
  id: string;
  name: string;
  gender: GenderChoices;
  phone_number: string;
  emergency_phone_number?: string;
  address?: string;
  permanent_address?: string;
  pincode?: string;
  date_of_birth?: string;
  deceased_datetime?: string | null;
  blood_group?: BloodGroupChoices;
  year_of_birth: number;
  created_date: string;
  modified_date: string;
  geo_organization: Organization;
  created_by: UserBareMinimum | null;
  updated_by: UserBareMinimum | null;
  permissions: string[];
  nationality?: string;
}

export interface PatientCreate
  extends Omit<
    Patient,
    | "id"
    | "created_date"
    | "modified_date"
    | "created_by"
    | "updated_by"
    | "year_of_birth"
    | "permissions"
    | "geo_organization"
    | "instance_identifiers"
  > {
  age?: number;
  identifiers: PatientIdentifierCreate[];
  // organizationId
  geo_organization: string;
  // facilityId
  facility: string;
  // tags to assign at creation (array of UUIDs)
  tags?: string[];
}

export interface PatientUpdate
  extends Omit<
    Patient,
    | "id"
    | "created_date"
    | "modified_date"
    | "created_by"
    | "updated_by"
    | "year_of_birth"
    | "permissions"
    | "geo_organization"
    | "instance_identifiers"
  > {
  age?: number;
  identifiers: PatientIdentifierCreate[];
  // organizationId
  geo_organization: string;
}

export interface PatientRead extends Patient {
  instance_tags: TagConfig[];
  facility_tags: TagConfig[];
  instance_identifiers: PatientIdentifier[];
}

export interface PartialPatientModel {
  id: string;
  gender: GenderChoices;
  name: string;
  phone_number: string;
  partial_id: string;
}

export interface PatientSearchResponse {
  partial: boolean;
  results: PartialPatientModel[] | Patient[];
}

export function getPartialId(patient: PartialPatientModel | Patient) {
  if ("partial_id" in patient) {
    return patient.partial_id;
  }
  return patient.id.slice(0, 5);
}
