import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
  ConsultationSuggestionValue,
  DISCHARGE_REASONS,
  PATIENT_NOTES_THREADS,
  UserRole,
} from "../../Common/constants";
import { AssetData, AssetLocationType } from "../Assets/AssetTypes";
import { RouteToFacility } from "../Common/RouteToFacilitySelect";
import { InvestigationType } from "../Common/prescription-builder/InvestigationBuilder";
import { ProcedureType } from "../Common/prescription-builder/ProcedureBuilder";
import { ConsultationDiagnosis, CreateDiagnosis } from "../Diagnosis/types";
import { NormalPrescription, PRNPrescription } from "../Medicine/models";
import { AssignedToObjectModel, DailyRoundsModel } from "../Patient/models";
import { EncounterSymptom } from "../Symptoms/types";
import { UserBareMinimum } from "../Users/models";

export interface LocalBodyModel {
  id: number;
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
  panchayath: string;
  local_body_id: LocalBodyModel["id"];
}

export interface FacilityModel {
  id?: string;
  name?: string;
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
  state?: number;
  district?: number;
  local_body?: number;
  ward?: number;
  pincode?: string;
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

export type PatientCategory = "Comfort Care" | "Mild" | "Moderate" | "Critical";

export interface PatientConsentModel {
  id: string;
  type: (typeof CONSENT_TYPE_CHOICES)[number]["id"];
  patient_code_status:
    | (typeof CONSENT_PATIENT_CODE_STATUS_CHOICES)[number]["id"]
    | null;
  archived: boolean;
  archived_by?: UserBareMinimum;
  archived_date: string;
  created_date: string;
  created_by: UserBareMinimum;
}

export interface ConsultationModel {
  encounter_date: string;
  icu_admission_date?: string;
  admitted?: boolean;
  test_id?: string;
  admitted_to?: string;
  category?: PatientCategory;
  created_date?: string;
  discharge_date?: string;
  new_discharge_reason?: (typeof DISCHARGE_REASONS)[number]["id"];
  discharge_prescription?: NormalPrescription;
  discharge_prn_prescription?: PRNPrescription;
  discharge_notes?: string;
  examination_details?: string;
  history_of_present_illness?: string;
  facility: string;
  facility_name?: string;
  id: string;
  modified_date?: string;
  patient: string;
  treatment_plan?: string;
  referred_to?: FacilityModel["id"];
  referred_to_object?: FacilityModel;
  referred_to_external?: string;
  referred_from_facility?: FacilityModel["id"];
  referred_from_facility_object?: FacilityModel;
  referred_from_facility_external?: string;
  referred_by_external?: string;
  transferred_from_location?: LocationModel["id"];
  transferred_from_location_object?: LocationModel;
  suggestion?: ConsultationSuggestionValue;
  patient_no?: string;
  route_to_facility?: RouteToFacility;
  is_kasp?: boolean;
  kasp_enabled_date?: string;
  readonly diagnoses?: ConsultationDiagnosis[];
  create_diagnoses?: CreateDiagnosis[]; // Used for bulk creating diagnoses upon consultation creation
  readonly symptoms?: EncounterSymptom[];
  create_symptoms?: CreateDiagnosis[]; // Used for bulk creating symptoms upon consultation creation
  deprecated_verified_by?: string;
  readonly treating_physician?: UserBareMinimum["id"];
  treating_physician_object?: UserBareMinimum;
  suggestion_text?: string;
  consultation_notes?: string;
  is_telemedicine?: boolean;
  procedure?: ProcedureType[];
  assigned_to?: string;
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
  last_daily_round?: DailyRoundsModel;
  current_bed?: CurrentBed;
  review_interval?: number;
  cause_of_death?: string;
  death_datetime?: string;
  death_confirmed_doctor?: string;
  is_readmission?: boolean;
  medico_legal_case?: boolean;
  investigation?: InvestigationType[];
}

export interface PatientStatsModel {
  id?: string;
  entryDate?: string;
  num_patients_visited?: number;
  num_patients_home_quarantine?: number;
  num_patients_isolation?: number;
  num_patient_referred?: number;
  entry_date?: string;
  num_patient_confirmed_positive?: number;
}

export interface DupPatientModel {
  id: number;
  gender: string;
  phone_number: string;
  patient_id: string;
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
    },
  ];
}

export interface LocationModel {
  id: string;
  name: string;
  description?: string;
  middleware_address?: string;
  location_type: AssetLocationType;
  facility?: {
    name: string;
  };
  created_date?: string;
  modified_date?: string;
}

export interface BedModel {
  id?: string;
  bed_type?: string;
  name?: string;
  description?: string;
  facility?: string;
  location_object?: {
    name: string;
    id?: string;
  };
  location?: string;
  is_occupied?: boolean;
  created_date?: string;
  modified_date?: string;
}

export interface CurrentBed {
  id: string;
  consultation: string;
  bed?: string;
  bed_object: BedModel;
  assets_objects?: AssetData[];
  created_date: string;
  modified_date: string;
  start_date: string;
  end_date: string;
  meta: Record<string, any>;
}

// Voluntarily made as `type` for it to achieve type-safety when used with
// `useAsyncOptions<ICD11DiagnosisModel>`
export type ICD11DiagnosisModel = {
  id: string;
  label: string;
};

export type ABGPlotsFields =
  | "ph"
  | "pco2"
  | "po2"
  | "hco3"
  | "base_excess"
  | "lactate"
  | "sodium"
  | "potassium"
  | "ventilator_fi02";

export type ABGPlotsRes = {
  ph: string;
  pco2: number;
  po2: number;
  hco3: string;
  base_excess: number;
  lactate: string;
  sodium: string;
  potassium: string;
  ventilator_fi02: number;
};

export type DialysisPlotsFields =
  | "dialysis_fluid_balance"
  | "dialysis_net_balance";

export type DialysisPlotsRes = {
  dialysis_fluid_balance: number;
  dialysis_net_balance: number;
};

export type NeurologicalTablesFields =
  | "consciousness_level"
  | "consciousness_level_detail"
  | "left_pupil_size"
  | "left_pupil_size_detail"
  | "right_pupil_size"
  | "right_pupil_size_detail"
  | "left_pupil_light_reaction"
  | "left_pupil_light_reaction_detail"
  | "right_pupil_light_reaction"
  | "right_pupil_light_reaction_detail"
  | "limb_response_upper_extremity_right"
  | "limb_response_upper_extremity_left"
  | "limb_response_lower_extremity_left"
  | "limb_response_lower_extremity_right"
  | "glasgow_eye_open"
  | "glasgow_verbal_response"
  | "glasgow_motor_response"
  | "glasgow_total_calculated";

export type NeurologicalTablesRes = {
  consciousness_level: number;
  consciousness_level_detail: string;
  left_pupil_size: number;
  left_pupil_size_detail: string;
  right_pupil_size: number;
  right_pupil_size_detail: string;
  left_pupil_light_reaction: number;
  left_pupil_light_reaction_detail: string;
  right_pupil_light_reaction: number;
  right_pupil_light_reaction_detail: string;
  limb_response_upper_extremity_right: number;
  limb_response_upper_extremity_left: number;
  limb_response_lower_extremity_left: number;
  limb_response_lower_extremity_right: number;
  glasgow_eye_open: number;
  glasgow_verbal_response: number;
  glasgow_motor_response: number;
  glasgow_total_calculated: number;
};

export type NursingPlotFields = "nursing";

export type NursingPlotRes = {
  nursing: any[];
};

export type NutritionPlotsFields =
  | "infusions"
  | "iv_fluids"
  | "feeds"
  | "total_intake_calculated"
  | "total_output_calculated"
  | "output";

export type NutritionPlotsRes = {
  infusions: any[];
  iv_fluids: any[];
  feeds: any[];
  total_intake_calculated: string;
  total_output_calculated: string;
  output: any[];
};

export type PainDiagramsFields = "pain_scale_enhanced";

export type PainDiagramsRes = {
  pain_scale_enhanced: any[];
};

export type PressureSoreDiagramsFields = "pressure_sore";

export type PressureSoreDiagramsRes = {
  pressure_sore: any[];
};

export type PrimaryParametersPlotFields =
  | "bp"
  | "pulse"
  | "temperature"
  | "resp"
  | "blood_sugar_level"
  | "insulin_intake_frequency"
  | "insulin_intake_dose"
  | "ventilator_spo2"
  | "ventilator_fi02"
  | "rhythm"
  | "rhythm_detail";

export type PrimaryParametersPlotRes = {
  bp: {
    mean?: number;
    systolic?: number;
    diastolic?: number;
  };
  pulse: number;
  temperature: string;
  resp: number;
  blood_sugar_level: number;
  insulin_intake_frequency: number;
  insulin_intake_dose: string;
  ventilator_spo2: number;
  ventilator_fi02: number;
  rhythm: number;
  rhythm_detail: string;
};

export type VentilatorPlotFields =
  | "ventilator_pip"
  | "ventilator_mean_airway_pressure"
  | "ventilator_resp_rate"
  | "ventilator_pressure_support"
  | "ventilator_tidal_volume"
  | "ventilator_peep"
  | "ventilator_fi02"
  | "ventilator_spo2"
  | "etco2"
  | "bilateral_air_entry"
  | "ventilator_oxygen_modality_oxygen_rate"
  | "ventilator_oxygen_modality_flow_rate";

export type VentilatorPlotRes = {
  ventilator_pip: number;
  ventilator_mean_airway_pressure: number;
  ventilator_resp_rate: number;
  ventilator_pressure_support: number;
  ventilator_tidal_volume: number;
  ventilator_peep: string;
  ventilator_fi02: number;
  ventilator_spo2: number;
  etco2: number;
  bilateral_air_entry: boolean;
  ventilator_oxygen_modality_oxygen_rate: number;
  ventilator_oxygen_modality_flow_rate: number;
};

export interface DailyRoundsBody {
  page?: number;
  fields:
    | ABGPlotsFields[]
    | DialysisPlotsFields[]
    | NeurologicalTablesFields[]
    | NursingPlotFields[]
    | NutritionPlotsFields[]
    | PainDiagramsFields[]
    | PressureSoreDiagramsFields[]
    | PrimaryParametersPlotFields[]
    | VentilatorPlotFields[];
}

export interface DailyRoundsRes {
  count: number;
  page_size: number;
  results: {
    [date: string]:
      | PressureSoreDiagramsRes
      | ABGPlotsRes
      | DialysisPlotsRes
      | NeurologicalTablesRes
      | NursingPlotRes
      | NutritionPlotsRes
      | PainDiagramsRes
      | PrimaryParametersPlotRes
      | VentilatorPlotRes;
  };
}

export interface CreateBedBody {
  start_date: string;
  assets: string[];
  consultation: string;
  bed: string;
}

// Patient Notes Model
export interface BaseFacilityModel {
  id: string;
  name: string;
  local_body: number;
  district: number;
  state: number;
  ward_object: WardModel;
  local_body_object?: LocalBodyModel;
  district_object?: DistrictModel;
  state_object?: StateModel;
  facility_type: FacilityType;
  read_cover_image_url: any;
  features: any[];
  patient_count: number;
  bed_count: number;
}

export interface FacilityType {
  id: number;
  name: string;
}

export interface BaseUserModel {
  id: number;
  first_name: string;
  username: string;
  email: string;
  last_name: string;
  user_type: string;
  last_login: string;
}

export interface PatientNotesEditModel {
  id: string;
  edited_by: BaseUserModel;
  edited_date: string;
  note: string;
}

export interface PatientNotesModel {
  id: string;
  note: string;
  facility: BaseFacilityModel;
  created_by_object: BaseUserModel;
  user_type?: UserRole | "RemoteSpecialist";
  thread: (typeof PATIENT_NOTES_THREADS)[keyof typeof PATIENT_NOTES_THREADS];
  created_date: string;
  last_edited_by?: BaseUserModel;
  last_edited_date?: string;
}

export interface PatientNoteStateType {
  notes: PatientNotesModel[];
  patientId?: string;
  facilityId?: string;
  cPage: number;
  totalPages: number;
}

export type IFacilityNotificationRequest = {
  facility: string;
  message: string;
};

export type IFacilityNotificationResponse = {
  [key: string]: string;
};

export type IUserFacilityRequest = {
  facility: string;
};

export type FacilityRequest = Omit<FacilityModel, "location"> & {
  latitude?: string;
  longitude?: string;
  kasp_empanelled?: boolean;
  patient_count?: string;
  bed_count?: string;
};

export type InventorySummaryResponse = {
  id: string;
  item_object: {
    id: number;
    default_unit: {
      id: number;
      name: string;
    };
    allowed_units: {
      id: number;
      name: string;
    }[];
    tags: {
      id: number;
      name: string;
    }[];
    name: string;
    description: string;
    min_quantity: number;
  };
  unit_object: {
    id: number;
    name: string;
  };
  created_date: string;
  quantity: number;
  is_low: boolean;
  item: number;
};

export type MinimumQuantityItemResponse = {
  id: string;
  item_object: InventoryItemsModel;
  created_date: string;
  min_quantity: number;
  item: number;
};

export type InventoryLogResponse = InventorySummaryResponse & {
  external_id: string;
  current_stock: number;
  quantity_in_default_unit: number;
  is_incoming: boolean;
  probable_accident: boolean;
  unit: number;
  created_by: number;
};

export type PatientTransferRequest = {
  facility: string;
  year_of_birth: string;
};

export type PatientTransferResponse = {
  id: string;
  patient: string;
  date_of_birth: string;
  facility_object: BaseFacilityModel;
};
