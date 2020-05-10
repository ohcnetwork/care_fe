export interface FacilityModel {
  id?: number;
  name?: string;
  district?: number;
  facility_type?: string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  oxygen_capacity?: number;
  phone_number?: string;
  local_body_object?: {
    name: string;
    body_type: number;
    localbody_code: string;
    district: number;
  };
  district_object?: { id: number; name: string; state: number };
  state_object?: { id: number; name: string };
}

export interface CapacityModal {
  id?: number;
  room_type?: number;
  total_capacity?: number;
  current_capacity?: number;
}

export interface DoctorModal {
  id?: number;
  area?: number;
  count?: number;
}

export interface OptionsType {
  id: number;
  text: string;
  disabled?: boolean;
}

export interface ConsultationModel {
  admission_date?: string;
  admitted?: boolean;
  admitted_to?: string;
  category?: string;
  created_date?: string;
  discharge_date?: string;
  examination_details?: string;
  existing_medication?: string;
  facility?: number;
  facility_name?: string;
  id?: number;
  modified_date?: string;
  other_symptoms?: string;
  patient?: number;
  prescribed_medication?: string;
  referred_to?: number | null;
  suggestion?: string;
  suggestion_text?: string;
  symptoms?: Array<number>;
  symptoms_text?: string;
  symptoms_onset_date?: string;
}
export interface PatientStatsModel {
  id?: number;
  entryDate?: string;
  num_patients_visited?: number;
  num_patients_home_quarantine?: number;
  num_patients_isolation?: number;
  num_patient_referred?: number;
  entry_date?: number;
}

export interface DupPatientModel {
  id: number;
  gender: string;
  phone_number: string;
  patient_id: number;
  name: string
  date_of_birth: string;
  year_of_birth: number;
  state_id: number;
}