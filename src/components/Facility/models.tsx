import { AssetData, AssetLocationType } from "@/components/Assets/AssetTypes";
import { RouteToFacility } from "@/components/Common/RouteToFacilitySelect";
import { InvestigationType } from "@/components/Common/prescription-builder/InvestigationBuilder";
import { ProcedureType } from "@/components/Common/prescription-builder/ProcedureBuilder";
import {
  ConsultationDiagnosis,
  CreateDiagnosis,
} from "@/components/Diagnosis/types";
import {
  AssignedToObjectModel,
  BloodPressure,
  DailyRoundsModel,
  FacilityNameModel,
  FileUploadModel,
  PatientModel,
} from "@/components/Patient/models";
import { EncounterSymptom } from "@/components/Symptoms/types";
import { UserBareMinimum } from "@/components/Users/models";

import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
  ConsultationSuggestionValue,
  DISCHARGE_REASONS,
  PATIENT_NOTES_THREADS,
  SHIFTING_CHOICES_PEACETIME,
  UserRole,
} from "@/common/constants";

import { FeatureFlag } from "@/Utils/featureFlags";

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
  facility_flags?: FeatureFlag[];
  latitude?: string;
  longitude?: string;
  kasp_empanelled?: boolean;
  patient_count?: number;
  bed_count?: number;
}

export enum SpokeRelationship {
  REGULAR = 1,
  TELE_ICU = 2,
}

export interface FacilitySpokeModel {
  id: string;
  hub_object: FacilityNameModel;
  spoke_object: FacilityNameModel;
  relationship: SpokeRelationship;
}

export interface FacilitySpokeRequest {
  spoke?: string;
  relationship?: SpokeRelationship;
}

export interface FacilitySpokeErrors {}

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
  | "Comfort Care" // Discontinued
  | "Mild"
  | "Moderate"
  | "Critical"
  | "Actively Dying";

export interface PatientConsentModel {
  id: string;
  type: (typeof CONSENT_TYPE_CHOICES)[number]["id"];
  patient_code_status:
    | (typeof CONSENT_PATIENT_CODE_STATUS_CHOICES)[number]["id"]
    | null;
  files: FileUploadModel[] | null;
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
  has_consents?: (typeof CONSENT_TYPE_CHOICES)[number]["id"][];
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
  is_expired: boolean;
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
    id: string;
    facility?: { name: string; id: string };
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

export type ICD11DiagnosisModel = {
  id: string;
  label: string;
};

export const ABGPlotsFields = [
  "ph",
  "pco2",
  "po2",
  "hco3",
  "base_excess",
  "lactate",
  "sodium",
  "potassium",
  "ventilator_fio2",
] as const satisfies (keyof DailyRoundsModel)[];

export type ABGPlotsRes = {
  ph: string;
  pco2: number;
  po2: number;
  hco3: string;
  base_excess: number;
  lactate: string;
  sodium: string;
  potassium: string;
  ventilator_fio2: number;
};

export const DialysisPlotsFields = [
  "dialysis_fluid_balance",
  "dialysis_net_balance",
] as const satisfies (keyof DailyRoundsModel)[];

export type DialysisPlotsRes = {
  dialysis_fluid_balance: number;
  dialysis_net_balance: number;
};

export const NeurologicalTablesFields = [
  "consciousness_level",
  "left_pupil_size",
  "left_pupil_size_detail",
  "right_pupil_size",
  "right_pupil_size_detail",
  "left_pupil_light_reaction",
  "left_pupil_light_reaction_detail",
  "right_pupil_light_reaction",
  "right_pupil_light_reaction_detail",
  "limb_response_upper_extremity_right",
  "limb_response_upper_extremity_left",
  "limb_response_lower_extremity_left",
  "limb_response_lower_extremity_right",
  "glasgow_eye_open",
  "glasgow_verbal_response",
  "glasgow_motor_response",
  "glasgow_total_calculated",
] as const satisfies (keyof DailyRoundsModel)[];

export type NeurologicalTablesRes = {
  consciousness_level: number;
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

export const NursingPlotFields = [
  "nursing",
] as const satisfies (keyof DailyRoundsModel)[];

export type NursingPlotRes = {
  nursing: Array<{
    procedure: string;
    description: string;
  }>;
};

export const RoutineFields = [
  "sleep",
  "bowel_issue",
  "bladder_drainage",
  "bladder_issue",
  "is_experiencing_dysuria",
  "urination_frequency",
  "nutrition_route",
  "oral_issue",
  "appetite",
] as const satisfies (keyof DailyRoundsModel)[];

export type RoutineAnalysisRes = Record<(typeof RoutineFields)[number], any>;

export const NutritionPlotsFields = [
  "infusions",
  "iv_fluids",
  "feeds",
  "total_intake_calculated",
  "total_output_calculated",
  "output",
] as const satisfies (keyof DailyRoundsModel)[];

export type NutritionPlotsRes = {
  infusions: any[];
  iv_fluids: any[];
  feeds: any[];
  total_intake_calculated: string;
  total_output_calculated: string;
  output: any[];
};

export const PainDiagramsFields = [
  "pain_scale_enhanced",
] as const satisfies (keyof DailyRoundsModel)[];

export type PainDiagramsRes = {
  pain_scale_enhanced: any[];
};

export const PressureSoreDiagramsFields = [
  "pressure_sore",
] as const satisfies (keyof DailyRoundsModel)[];

export type PressureSoreDiagramsRes = {
  pressure_sore: any[];
};

export const PrimaryParametersPlotFields = [
  "bp",
  "pulse",
  "temperature",
  "resp",
  "blood_sugar_level",
  "insulin_intake_frequency",
  "insulin_intake_dose",
  "ventilator_spo2",
  "ventilator_fio2",
  "rhythm",
  "rhythm_detail",
  "pain_scale_enhanced",
] as const satisfies (keyof DailyRoundsModel)[];

export type PrimaryParametersPlotRes = {
  bp: BloodPressure;
  pulse: number;
  temperature: string;
  resp: number;
  blood_sugar_level: number;
  insulin_intake_frequency: number;
  insulin_intake_dose: string;
  ventilator_spo2: number;
  ventilator_fio2: number;
  rhythm: number;
  rhythm_detail: string;
};

export const VentilatorPlotFields = [
  "ventilator_pip",
  "ventilator_mean_airway_pressure",
  "ventilator_resp_rate",
  "ventilator_pressure_support",
  "ventilator_tidal_volume",
  "ventilator_peep",
  "ventilator_fio2",
  "ventilator_spo2",
  "etco2",
  "bilateral_air_entry",
  "ventilator_oxygen_modality_oxygen_rate",
  "ventilator_oxygen_modality_flow_rate",
] as const satisfies (keyof DailyRoundsModel)[];

export type VentilatorPlotRes = {
  ventilator_pip: number;
  ventilator_mean_airway_pressure: number;
  ventilator_resp_rate: number;
  ventilator_pressure_support: number;
  ventilator_tidal_volume: number;
  ventilator_peep: string;
  ventilator_fio2: number;
  ventilator_spo2: number;
  etco2: number;
  bilateral_air_entry: boolean;
  ventilator_oxygen_modality_oxygen_rate: number;
  ventilator_oxygen_modality_flow_rate: number;
};

export interface DailyRoundsBody {
  page?: number;
  fields:
    | typeof ABGPlotsFields
    | typeof DialysisPlotsFields
    | typeof NeurologicalTablesFields
    | typeof NursingPlotFields
    | typeof RoutineFields
    | typeof NutritionPlotsFields
    | typeof PainDiagramsFields
    | typeof PressureSoreDiagramsFields
    | typeof PrimaryParametersPlotFields
    | typeof VentilatorPlotFields;
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
      | RoutineAnalysisRes
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

export interface PaitentNotesReplyModel {
  id: string;
  note: string;
  user_type?: UserRole | "RemoteSpecialist";
  created_by_object: BaseUserModel;
  created_date: string;
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
  reply_to_object?: PaitentNotesReplyModel;
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

export type FacilityRequest = Omit<FacilityModel, "location" | "id">;

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

export interface ShiftingModel {
  shifting_approving_facility_object: FacilityModel | null;
  status: (typeof SHIFTING_CHOICES_PEACETIME)[number]["text"];
  id: string;
  patient_object: PatientModel;
  emergency: boolean;
  origin_facility_object: FacilityModel;
  origin_facility: string;
  shifting_approving_facility: string;
  assigned_facility_external: string | null;
  assigned_facility: string | null;
  is_up_shift: boolean;
  assigned_to: number;
  patient_category: string;
  assigned_facility_object: FacilityModel;
  assigned_facility_external_object: FacilityModel;
  modified_date: string;
  external_id: string;
  assigned_to_object?: AssignedToObjectModel;
  refering_facility_contact_name: string;
  refering_facility_contact_number: string;
  is_kasp: boolean;
  vehicle_preference: string;
  preferred_vehicle_choice: string;
  assigned_facility_type: string;
  breathlessness_level: string;
  reason: string;
  ambulance_driver_name: string;
  ambulance_phone_number: string | undefined;
  ambulance_number: string;
  comments: string;
  created_date: string;
  created_by_object: UserBareMinimum;
  last_edited_by_object: UserBareMinimum;
  is_assigned_to_user: boolean;
  created_by: number;
  last_edited_by: number;
  patient: string | PatientModel;
  initial_status?: string;
}

export interface ResourceModel {
  approving_facility: string | null;
  approving_facility_object: FacilityModel | null;
  assigned_facility: string | null;
  assigned_facility_object: FacilityModel | null;
  assigned_quantity: number;
  assigned_to: string | null;
  category: string;
  created_by: number;
  emergency: boolean;
  id: string;
  is_assigned_to_user: boolean;
  last_edited_by: number;
  modified_date: string;
  origin_facility: string;
  origin_facility_object: FacilityModel;
  priority: number | null;
  reason: string;
  refering_facility_contact_name: string;
  refering_facility_contact_number: string;
  requested_quantity: number;
  status: string;
  sub_category: string;
  title: string;
  assigned_to_object: UserBareMinimum | null;
  created_by_object: UserBareMinimum | null;
  created_date: string;
  last_edited_by_object: UserBareMinimum;
}

export interface CommentModel {
  id: string;
  created_by_object: UserBareMinimum;
  created_date: string;
  modified_date: string;
  comment: string;
  created_by: number;
}
