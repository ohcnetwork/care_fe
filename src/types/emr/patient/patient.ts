import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { Organization } from "@/types/organization/organization";
import { PatientIdentifier } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { UserReadMinimal } from "@/types/user/user";

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

export interface PatientBase {
  id: string;
  name: string;
  gender: GenderChoices;
  phone_number: string;
  emergency_phone_number?: string;
  address?: string;
  permanent_address?: string;
  pincode?: number;
  date_of_birth?: string;
  deceased_datetime?: string | null;
  blood_group?: BloodGroupChoices;
  geo_organization: string;
  nationality?: string;
}

export interface PatientRead extends Omit<PatientBase, "geo_organization"> {
  geo_organization: Organization;
  year_of_birth: number;
  created_date: string;
  modified_date: string;
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
  permissions: string[];
  instance_tags: TagConfig[];
  facility_tags: TagConfig[];
  instance_identifiers: PatientIdentifier[];
}

export interface PatientCreate extends Omit<PatientBase, "id"> {
  age?: number;
  identifiers: PatientIdentifierCreate[];
  facility: string;
  tags?: string[];
}

export interface PatientUpdate extends Omit<PatientBase, "id"> {
  age?: number;
  identifiers: PatientIdentifierCreate[];
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
  results: PartialPatientModel[] | PatientRead[];
}

export interface PatientSearchRequest {
  phone_number?: string;
  config?: string;
  value?: string;
  page_size?: number;
}

export interface PatientSearchRetrieveRequest {
  phone_number?: string;
  year_of_birth?: string;
  partial_id?: string;
}

export function getPartialId(patient: PartialPatientModel | PatientRead) {
  if ("partial_id" in patient) {
    return patient.partial_id;
  }
  return patient.id.slice(0, 5);
}
