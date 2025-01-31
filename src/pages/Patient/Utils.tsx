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
