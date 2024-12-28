import { PatientCategory } from "@/components/Facility/models";
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

export type FileCategory = "unspecified" | "xray" | "audio" | "identity_proof";

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
