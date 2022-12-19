import { PRNPrescriptionType } from "../Common/prescription-builder/PRNPrescriptionBuilder";
import { AssignedToObjectModel } from "../Patient/models";

export interface LocalBodyModel {
  name: string;
  body_type: number;
  localbody_code: string;
  district: number;
}
export interface DistrictModel {
  id: number;
  name: string;
  state: number;
}
export interface StateModel {
  id: number;
  name: string;
}
export interface WardModel {
  id: number;
  name: string;
  number: number;
  local_body: number;
}
export interface FacilityModel {
  id?: number;
  name?: string;
  district?: number;
  read_cover_image_url?: string;
  facility_type?: string;
  address?: string;
  features?: number[];
  location?: {
    latitude: number;
    longitude: number;
  };
  oxygen_capacity?: number;
  phone_number?: string;
  type_b_cylinders?: number;
  type_c_cylinders?: number;
  type_d_cylinders?: number;
  middleware_address?: string;
  expected_type_b_cylinders?: number;
  expected_type_c_cylinders?: number;
  expected_type_d_cylinders?: number;
  expected_oxygen_requirement?: number;
  local_body_object?: LocalBodyModel;
  district_object?: DistrictModel;
  state_object?: StateModel;
  ward_object?: WardModel;
  modified_date?: string;
  created_date?: string;
}

export interface CapacityModal {
  id?: number;
  room_type?: number;
  modified_date?: any;
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

export type PatientCategory =
  | "Comfort Care"
  | "Stable"
  | "Slightly Abnormal"
  | "Critical"
  | "unknown";

export interface ConsultationModel {
  admission_date?: string;
  admitted?: boolean;
  test_id?: string;
  admitted_to?: string;
  category?: PatientCategory;
  created_date?: string;
  discharge_date?: string;
  discharge_reason?: string;
  examination_details?: string;
  history_of_present_illness?: string;
  facility?: number;
  facility_name?: string;
  id?: number;
  modified_date?: string;
  other_symptoms?: string;
  patient?: number;
  prescribed_medication?: string;
  referred_to?: number | null;
  suggestion?: string;
  ip_no?: string;
  is_kasp?: boolean;
  kasp_enabled_date?: string;
  diagnosis?: string;
  icd11_diagnoses_object?: ICD11DiagnosisModel[];
  icd11_provisional_diagnoses_object?: ICD11DiagnosisModel[];
  verified_by?: string;
  suggestion_text?: string;
  symptoms?: Array<number>;
  symptoms_text?: string;
  symptoms_onset_date?: string;
  consultation_notes?: string;
  is_telemedicine?: boolean;
  discharge_advice?: any;
  prn_prescription?: PRNPrescriptionType[];
  assigned_to_object?: AssignedToObjectModel;
  created_by?: any;
  last_edited_by?: any;
  weight?: number | null;
  height?: number | null;
  operation?: string;
  special_instruction?: string;
  intubation_start_date?: string;
  intubation_end_date?: string;
  ett_tt?: number;
  cuff_pressure?: number;
  lines?: any;
  last_daily_round?: any;
  current_bed?: CurrentBed;
  review_interval?: number;
}
export interface PatientStatsModel {
  id?: number;
  entryDate?: string;
  num_patients_visited?: number;
  num_patients_home_quarantine?: number;
  num_patients_isolation?: number;
  num_patient_referred?: number;
  entry_date?: number;
  num_patient_confirmed_positive?: number;
}

export interface DupPatientModel {
  id: number;
  gender: string;
  phone_number: string;
  patient_id: number;
  name: string;
  date_of_birth: string;
  year_of_birth: number;
  state_id: number;
}

export interface InventoryItemsModel {
  // count?: number;
  id?: number;
  name?: string;
  default_unit?: {
    id: number;
    name: string;
  };
  allowed_units?: [
    {
      id: number;
      name: string;
    }
  ];
}

export interface LocationModel {
  id?: string;
  name?: string;
  description?: string;
  facility?: {
    name: string;
  };
}

export interface BedModel {
  id?: string;
  bed_type?: string;
  description?: string;
  name?: string;
  facility?: string;
  location_object?: {
    name: string;
  };
  location?: string;
  is_occupied?: boolean;
}

export interface CurrentBed {
  id: string;
  consultation: string;
  bed?: string;
  bed_object: BedModel;
  created_date: string;
  modified_date: string;
  start_date: string;
  end_date: string;
  meta: Record<string, any>;
}

export interface ICD11DiagnosisModel {
  id: string;
  label: string;
  parentId: string | null;
}
