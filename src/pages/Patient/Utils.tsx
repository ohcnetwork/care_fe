import { Organization } from "@/types/organization/organization";

export type AppointmentPatientRegister = {
  name: string;
  gender: string;
  phone_number: string;
  address: string;
  date_of_birth?: Date | string;
  year_of_birth?: string;
  geo_organization?: string;
  pincode?: string;
};

export type AppointmentPatient = {
  id: string;
  external_id: string;
  name: string;
  phone_number: string;
  emergency_phone_number: string;
  address: string;
  date_of_birth?: string;
  year_of_birth?: string;
  state: number;
  district: number;
  local_body: number;
  ward: number;
  pincode: number;
  gender: string;
  geo_organization: Organization;
};
