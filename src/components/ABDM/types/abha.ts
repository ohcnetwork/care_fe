import { PatientModel } from "@/components/Patient/models";

export type AbhaNumberModel = {
  id: number;
  external_id: string;
  created_date: string;
  modified_date: string;
  abha_number: string;
  health_id: string;
  name: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: "F" | "M" | "O";
  date_of_birth: string | null;
  address: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  mobile: string | null;
  email: string | null;
  profile_photo: string | null;
  new: boolean;
  patient: string | null;
  patient_object: PatientModel | null;
};

export type ABHAQRContent = {
  hidn: string;
  name: string;
  gender: "M" | "F" | "O";
  dob: string;
  mobile: string;
  address: string;
  distlgd: string;
  statelgd: string;
} & ({ hid: string; phr?: never } | { phr: string; hid?: never }) &
  (
    | { district_name: string; "dist name"?: never }
    | { "dist name": string; district_name?: never }
  ) &
  (
    | { state_name: string; "state name"?: never }
    | { "state name": string; state_name?: never }
  );
