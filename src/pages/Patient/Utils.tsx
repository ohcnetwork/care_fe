export type AppointmentPatientRegister = {
  name: string;
  gender: string;
  phone_number: string;
  address: string;
  date_of_birth?: string;
  year_of_birth?: string;
  state?: number;
  district?: number;
  ward?: number;
  local_body?: number;
  pincode?: number;
};

export type AppointmentPatient = {
  id: string;
  external_id: string;
  name: string;
  phone_number: string;
  address: string;
  date_of_birth?: string;
  year_of_birth?: string;
  state: number;
  district: number;
  local_body: number;
  ward: number;
  pincode: number;
  gender: string;
};
