import {
  ConsultationModel,
  PatientCategory,
} from "@/components/Facility/models";
import { UserBareMinimum } from "@/components/Users/models";

import {
  APPETITE_CHOICES,
  BLADDER_DRAINAGE_CHOICES,
  BLADDER_ISSUE_CHOICES,
  BOWEL_ISSUE_CHOICES,
  CONSCIOUSNESS_LEVEL,
  DOMESTIC_HEALTHCARE_SUPPORT_CHOICES,
  HEARTBEAT_RHYTHM_CHOICES,
  HumanBodyRegion,
  INSULIN_INTAKE_FREQUENCY_OPTIONS,
  LIMB_RESPONSE_OPTIONS,
  NURSING_CARE_PROCEDURES,
  NUTRITION_ROUTE_CHOICES,
  OCCUPATION_TYPES,
  ORAL_ISSUE_CHOICES,
  OXYGEN_MODALITY_OPTIONS,
  PressureSoreExudateAmountOptions,
  PressureSoreTissueTypeOptions,
  RATION_CARD_CATEGORY,
  RESPIRATORY_SUPPORT,
  SLEEP_CHOICES,
  SOCIOECONOMIC_STATUS_CHOICES,
  URINATION_FREQUENCY_CHOICES,
  VENTILATOR_MODE_OPTIONS,
} from "@/common/constants";

export interface FlowModel {
  id?: number;
  status?: string;
  created_date?: string;
  modified_date?: string;
  deleted?: boolean;
  notes?: string;
  patient_sample?: number;
  created_by?: number;
}

export interface DischargeSummaryModel {
  email?: string;
}

export interface AssignedToObjectModel {
  first_name: string;
  last_name: string;
  last_login?: string;
  alt_phone_number?: string;
  user_type: string;
}

export interface PatientMeta {
  readonly id: number;
  occupation?: Occupation;
  socioeconomic_status?: (typeof SOCIOECONOMIC_STATUS_CHOICES)[number];
  domestic_healthcare_support?: (typeof DOMESTIC_HEALTHCARE_SUPPORT_CHOICES)[number];
}

export interface PatientModel {
  id?: string;
  action?: number;
  name?: string;
  allow_transfer?: boolean;
  discharge?: boolean;
  gender?: number;
  created_date?: string;
  modified_date?: string;
  facility?: string;
  phone_number?: string;
  emergency_phone_number?: string;
  allergies?: string;
  medical_history?: Array<{ disease: string | number; details: string }>;
  facility_object?: {
    id: number;
    name: string;
    facility_type?: { id: number; name: string };
  };
  contact_with_carrier?: boolean;
  medical_history_details?: string;
  is_active?: boolean;
  is_antenatal?: boolean;
  last_menstruation_start_date?: string;
  date_of_delivery?: string;
  is_migrant_worker?: boolean;
  ward?: string;
  local_body_object?: { id: number; name: string };
  ward_object?: { id: number; name: string; number: number };
  district_object?: { id: number; name: string };
  state_object?: { id: number; name: string };
  tele_consultation_history?: Array<any>;
  last_consultation?: ConsultationModel;
  address?: string;
  permanent_address?: string;
  sameAddress?: boolean;
  village?: string;
  pincode?: number;
  is_medical_worker?: boolean;
  designation_of_health_care_worker?: string;
  instituion_of_health_care_worker?: string;
  frontline_worker?: string;
  past_travel?: boolean;
  ongoing_medication?: string;
  countries_travelled?: Array<string>;
  transit_details?: string;
  present_health?: string;
  has_SARI?: boolean;
  local_body?: number;
  district?: number;
  state?: number;
  nationality?: string;
  passport_no?: string;
  ration_card_category?: (typeof RATION_CARD_CATEGORY)[number] | null;
  date_of_test?: string;
  date_of_result?: string; // keeping this to avoid errors in Death report
  covin_id?: string;
  is_vaccinated?: boolean;
  vaccine_name?: string;
  number_of_doses?: number;
  last_vaccinated_date?: string;
  date_of_birth?: string;
  year_of_birth?: number;
  readonly death_datetime?: string;
  blood_group?: string;
  review_interval?: number;
  review_time?: string;
  date_of_return?: string;
  number_of_aged_dependents?: number;
  number_of_chronic_diseased_dependents?: number;
  will_donate_blood?: boolean;
  fit_for_blood_donation?: boolean;
  date_declared_positive?: string;
  is_declared_positive?: boolean;
  last_edited?: UserBareMinimum;
  created_by?: UserBareMinimum;
  assigned_to?: { first_name?: string; username?: string; last_name?: string };
  assigned_to_object?: AssignedToObjectModel;
  occupation?: Occupation;
  meta_info?: PatientMeta;
  age?: string;
}

export interface SampleTestModel {
  patient_object?: PatientModel;
  atypical_presentation?: string;
  diagnosis?: string;
  diff_diagnosis?: string;
  testing_facility?: string;
  doctor_name?: string;
  etiology_identified?: string;
  has_ari?: boolean;
  has_sari?: boolean;
  is_atypical_presentation?: boolean;
  is_unusual_course?: boolean;
  sample_type?: string;
  sample_type_other?: string;
  id?: string;
  status?: string;
  result?: string;
  icmr_category?: string;
  icmr_label?: string;
  date_of_sample?: string;
  date_of_result?: string;
  consultation?: number;
  patient_name?: number;
  patient_has_sari?: boolean;
  patient_has_confirmed_contact?: boolean;
  patient_has_suspected_contact?: boolean;
  patient_travel_history?: string[];
  facility?: number;
  facility_object?: {
    id: number;
    name: string;
    facility_type?: { id: number; name: string };
  };
  patient?: number;
  fast_track?: string;
  isFastTrack?: boolean;
  flow?: Array<FlowModel>;
  created_by?: any;
  last_edited_by?: any;
  created_date?: string;
  modified_date?: string;
}

export interface SampleReportModel {
  id?: number;
  personal_details?: {
    name?: string;
    gender?: string;
    age_years?: number;
    age_months?: number;
    date_of_birth?: string;
    phone_number?: string;
    email?: string;
    address?: string;
    pincode?: string;
    passport_no?: string;
    aadhaar_no?: string;
    local_body_name?: string;
    district_name?: string;
    state_name?: string;
  };
  specimen_details?: {
    created_date?: string;
    sample_type?: string;
    collection_type?: string;
    icmr_category?: string;
    icmr_label?: string;
    is_repeated_sample?: boolean;
    lab_name?: string;
    lab_pincode?: string;
  };
  patient_category?: {
    symptomatic_international_traveller?: boolean;
    symptomatic_contact_of_confirmed_case?: boolean;
    symptomatic_healthcare_worker?: boolean;
    hospitalized_sari_patient?: boolean;
    asymptomatic_family_member_of_confirmed_case?: boolean;
    asymptomatic_healthcare_worker_without_protection?: boolean;
  };
  exposure_history?: {
    has_travel_to_foreign_last_14_days?: boolean;
    places_of_travel?: Array<string>;
    travel_start_date?: string;
    travel_end_date?: string;
    contact_with_confirmed_case?: boolean;
    contact_case_name?: string;
    was_quarantined?: boolean;
    quarantined_type?: string;
    healthcare_worker?: boolean;
  };
  medical_conditions?: {
    date_of_onset_of_symptoms?: string;
    symptoms?: Array<any>;
    has_sari?: boolean;
    has_ari?: boolean;
    medical_conditions_list?: Array<any>;
    hospitalization_date?: string;
    diagnosis?: string;
    diff_diagnosis?: string;
    etiology_identified?: string;
    is_atypical_presentation?: boolean;
    is_unusual_course?: boolean;
    hospital_phone_number?: string;
    hospital_name?: string;
    doctor_name?: string;
    hospital_pincode?: string;
  };
}

export interface SampleListModel {
  id?: number;
  patient_name?: string;
  patient_has_sari?: boolean;
  patient_has_confirmed_contact?: boolean;
  patient_has_suspected_contact?: boolean;
  patient_travel_history?: string;
  facility?: number;
  facility_object?: {
    id: number;
    name: string;
    facility_type?: { id: number; name: string };
  };
  status?: string;
  result?: string;
  patient?: number;
  consultation?: number;
  date_of_sample?: string;
  date_of_result?: string;
  fast_track?: string;
}

export const DailyRoundTypes = [
  "NORMAL",
  "COMMUNITY_NURSES_LOG",
  "DOCTORS_LOG",
  "VENTILATOR",
  "AUTOMATED",
  "TELEMEDICINE",
] as const;

export type BloodPressure = {
  systolic?: number;
  diastolic?: number;
};

export interface IPainScale {
  description: string;
  region: HumanBodyRegion;
  scale: number;
}

export type NameQuantity = { name: string; quantity: number };

export type IPressureSore = {
  region: HumanBodyRegion;
  width: number;
  length: number;
  description: string;
  scale: number;
  exudate_amount: (typeof PressureSoreExudateAmountOptions)[number];
  tissue_type: (typeof PressureSoreTissueTypeOptions)[number];
};
export interface DailyRoundsModel {
  spo2?: number;
  rhythm?: (typeof HEARTBEAT_RHYTHM_CHOICES)[number];
  rhythm_detail?: string;
  bp?: BloodPressure;
  pulse?: number;
  resp?: number;
  temperature?: number;
  physical_examination_info?: string;
  other_details?: string;
  consultation?: number;
  action?: string;
  review_interval?: number;
  id?: string;
  admitted_to?: string;
  patient_category?: PatientCategory;
  recommend_discharge?: boolean;
  created_date?: string;
  modified_date?: string;
  taken_at?: string;
  consciousness_level?: (typeof CONSCIOUSNESS_LEVEL)[number]["value"];
  rounds_type?: (typeof DailyRoundTypes)[number];
  last_updated_by_telemedicine?: boolean;
  created_by_telemedicine?: boolean;
  created_by?: UserBareMinimum;
  last_edited_by?: UserBareMinimum;
  bed?: string;
  pain_scale_enhanced?: IPainScale[];
  in_prone_position?: boolean;
  left_pupil_size?: number;
  left_pupil_size_detail?: string;
  left_pupil_light_reaction?: string;
  left_pupil_light_reaction_detail?: string;
  right_pupil_size?: number;
  right_pupil_size_detail?: string;
  right_pupil_light_reaction?: string;
  right_pupil_light_reaction_detail?: string;
  glasgow_eye_open?: number;
  glasgow_motor_response?: number;
  glasgow_verbal_response?: number;
  limb_response_upper_extremity_right?: (typeof LIMB_RESPONSE_OPTIONS)[number]["value"];
  limb_response_upper_extremity_left?: (typeof LIMB_RESPONSE_OPTIONS)[number]["value"];
  limb_response_lower_extremity_left?: (typeof LIMB_RESPONSE_OPTIONS)[number]["value"];
  limb_response_lower_extremity_right?: (typeof LIMB_RESPONSE_OPTIONS)[number]["value"];
  glasgow_total_calculated?: number;
  bilateral_air_entry?: boolean;
  etco2?: number;
  po2?: number;
  pco2?: number;
  ph?: number;
  hco3?: number;
  base_excess?: number;
  lactate?: number;
  sodium?: number;
  potassium?: number;
  blood_sugar_level?: number;
  insulin_intake_dose?: number;
  insulin_intake_frequency?: (typeof INSULIN_INTAKE_FREQUENCY_OPTIONS)[number];
  dialysis_fluid_balance?: number;
  dialysis_net_balance?: number;
  nursing?: {
    procedure: (typeof NURSING_CARE_PROCEDURES)[number];
    description: string;
  }[];
  feeds?: NameQuantity[];
  infusions?: NameQuantity[];
  iv_fluids?: NameQuantity[];
  output?: NameQuantity[];
  total_intake_calculated?: number;
  total_output_calculated?: number;
  ventilator_spo2?: number;
  ventilator_interface?: (typeof RESPIRATORY_SUPPORT)[number]["value"];
  ventilator_oxygen_modality?: (typeof OXYGEN_MODALITY_OPTIONS)[number]["value"];
  ventilator_oxygen_modality_flow_rate?: number;
  ventilator_oxygen_modality_oxygen_rate?: number;
  ventilator_fio2?: number;
  ventilator_mode?: (typeof VENTILATOR_MODE_OPTIONS)[number];
  ventilator_peep?: number;
  ventilator_pip?: number;
  ventilator_mean_airway_pressure?: number;
  ventilator_resp_rate?: number;
  ventilator_pressure_support?: number;

  ventilator_tidal_volume?: number;
  pressure_sore?: IPressureSore[];
  bowel_issue?: (typeof BOWEL_ISSUE_CHOICES)[number];
  bladder_drainage?: (typeof BLADDER_DRAINAGE_CHOICES)[number];
  bladder_issue?: (typeof BLADDER_ISSUE_CHOICES)[number];
  is_experiencing_dysuria?: boolean;
  urination_frequency?: (typeof URINATION_FREQUENCY_CHOICES)[number];
  sleep?: (typeof SLEEP_CHOICES)[number];
  nutrition_route?: (typeof NUTRITION_ROUTE_CHOICES)[number];
  oral_issue?: (typeof ORAL_ISSUE_CHOICES)[number];
  appetite?: (typeof APPETITE_CHOICES)[number];
}

export interface FacilityNameModel {
  id?: string;
  name?: string;
}

// File Upload Models

export type FileCategory = "UNSPECIFIED" | "XRAY" | "AUDIO" | "IDENTITY_PROOF";

export interface CreateFileRequest {
  file_type: string | number;
  file_category: FileCategory;
  name: string;
  associating_id: string;
  original_name: string;
  mime_type: string;
}

export interface CreateFileResponse {
  id: string;
  file_type: string;
  file_category: FileCategory;
  signed_url: string;
  internal_name: string;
}

export interface FileUploadModel {
  id?: string;
  name?: string;
  associating_id?: string;
  created_date?: string;
  upload_completed?: boolean;
  uploaded_by?: UserBareMinimum;
  file_category?: FileCategory;
  read_signed_url?: string;
  is_archived?: boolean;
  archive_reason?: string;
  extension?: string;
  archived_by?: UserBareMinimum;
  archived_datetime?: string;
}

export type Occupation = (typeof OCCUPATION_TYPES)[number]["value"];
