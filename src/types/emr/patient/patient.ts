import { Permissions } from "@/types/emr/permission/permission";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { Organization } from "@/types/organization/organization";
import {
  PatientIdentifier,
  PatientIdentifierUse,
} from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
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
  name: string;
  gender: GenderChoices;
  phone_number: string;
  emergency_phone_number?: string;
  address?: string;
  permanent_address?: string;
  pincode?: number;
  deceased_datetime?: string | null;
  blood_group?: BloodGroupChoices;
  date_of_birth?: string | null;
}

export interface PatientListRead extends PatientBase {
  id: string;
  year_of_birth: number | null;
  created_date: string;
  modified_date: string;
  instance_tags: TagConfig[];
  facility_tags: TagConfig[];
}

export interface PatientRead extends PatientListRead, Permissions {
  geo_organization?: Organization;
  created_by?: UserReadMinimal;
  updated_by?: UserReadMinimal;
  instance_identifiers: PatientIdentifier[];
  facility_identifiers: PatientIdentifier[];
  extensions?: Record<string, Record<string, unknown>>;
}

export interface PatientUpdate extends PatientBase {
  age?: number;
  geo_organization?: string;
  identifiers: PatientIdentifierCreate[];
  extensions?: Record<string, Record<string, unknown>>;
}

export interface PatientCreate extends PatientUpdate {
  tags?: string[];
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
  facility?: string;
}

export interface PatientSearchRetrieveRequest {
  phone_number: string;
  year_of_birth: string;
  partial_id: string;
  facility?: string;
}

export function getPartialId(patient: PartialPatientModel | PatientListRead) {
  if ("partial_id" in patient) {
    return patient.partial_id;
  }
  return patient.id.slice(0, 5);
}

/**
 * Identifiers to display for a patient: instance-level ones followed by
 * facility-level ones. Auto-maintained identifiers are never included.
 *
 * `facility_identifiers` is only populated by the backend when the patient was
 * fetched with a facility in context (e.g. `?facility=<id>`), so callers that
 * need facility identifiers must fetch the patient that way.
 *
 * The backend can list the same config in both arrays (its instance cache is
 * not filtered by facility), so entries are de-duplicated by config id.
 */
export function getPatientIdentifiers(
  patient:
    | Partial<
        Pick<PatientRead, "instance_identifiers" | "facility_identifiers">
      >
    | PatientListRead
    | PublicPatientRead
    | null
    | undefined,
  options: { use?: PatientIdentifierUse } = {},
): PatientIdentifier[] {
  if (!patient) return [];
  const instanceIdentifiers =
    "instance_identifiers" in patient
      ? (patient.instance_identifiers ?? [])
      : [];
  const facilityIdentifiers =
    "facility_identifiers" in patient
      ? (patient.facility_identifiers ?? [])
      : [];
  const byConfigId = new Map<string, PatientIdentifier>();
  for (const identifier of [...instanceIdentifiers, ...facilityIdentifiers]) {
    byConfigId.set(identifier.config.id, identifier);
  }
  return [...byConfigId.values()].filter(
    ({ config }) =>
      !config.config.auto_maintained &&
      (!options.use || config.config.use === options.use),
  );
}

export interface PublicPatientRead {
  id: string;
  name: string;
  gender: GenderChoices;
  phone_number: string;
  emergency_phone_number: string;
  address: string;
  pincode: number;
  date_of_birth: string;
  year_of_birth: number;
  geo_organization: Organization;
  blood_group: BloodGroupChoices;
}

export interface PublicPatientCreate {
  name: string;
  gender: GenderChoices;
  date_of_birth?: string;
  age?: number;
  address: string;
  pincode: number;
  geo_organization: string;
}
