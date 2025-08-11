import { BloodGroupChoices, GenderChoices } from "@/types/emr/patient/patient";
import { Organization } from "@/types/organization/organization";

export interface TokenData {
  token: string;
  phoneNumber: string;
  createdAt: string;
}

export type MFAMethod = "totp" | "backup";

export interface MFAOption {
  id: MFAMethod;
  label: string;
}

export interface TOTPSetupResponse {
  uri: string;
  secret_key: string;
}

export interface TOTPVerifyRequest {
  code: string;
}

export interface TOTPVerifyResponse {
  backup_codes: string[];
}

export interface TOTPDisableRequest {
  password: string;
}

export interface MFALoginRequest {
  method: string;
  code: string;
  temp_token: string;
}

export interface MFAAuthenticationToken {
  temp_token: string;
}

export interface PatientOTPRead {
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
