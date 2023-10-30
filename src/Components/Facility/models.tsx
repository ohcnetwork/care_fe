import { AssignedToObjectModel } from "../Patient/models";
import { ProcedureType } from "../Common/prescription-builder/ProcedureBuilder";
import { NormalPrescription, PRNPrescription } from "../Medicine/models";
import { AssetData } from "../Assets/AssetTypes";
import { UserBareMinimum } from "../Users/models";
import { PaginatedResponse } from "../../Utils/request/types";

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
export interface HomeFacilityModel {
  id: string;
  name: string;
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
  | "Abnormal"
  | "Critical";

export type ConsultationModel = {
  admission_date?: string;
  admitted?: boolean;
  test_id?: string;
  admitted_to?: string;
  category?: PatientCategory;
  created_date?: string;
  discharge_date?: string;
  discharge_reason?: string;
  discharge_prescription?: NormalPrescription;
  discharge_prn_prescription?: PRNPrescription;
  discharge_notes?: string;
  examination_details?: string;
  history_of_present_illness?: string;
  facility?: number;
  facility_name?: string;
  id?: string;
  modified_date?: string;
  other_symptoms?: string;
  patient?: string;
  treatment_plan?: string;
  referred_to?: number | null;
  referred_to_object?: FacilityModel;
  referred_to_external?: string;
  suggestion?: string;
  patient_no?: string;
  consultation_status?: number;
  is_kasp?: boolean;
  kasp_enabled_date?: string;
  diagnosis?: string;
  icd11_diagnoses_object?: ICD11DiagnosisModel[];
  icd11_provisional_diagnoses_object?: ICD11DiagnosisModel[];
  icd11_principal_diagnosis?: ICD11DiagnosisModel["id"];
  deprecated_verified_by?: string;
  verified_by?: string;
  verified_by_object?: UserBareMinimum;
  suggestion_text?: string;
  symptoms?: Array<number>;
  symptoms_text?: string;
  symptoms_onset_date?: string;
  consultation_notes?: string;
  is_telemedicine?: boolean;
  procedure?: ProcedureType[];
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
  cause_of_death?: string;
  death_datetime?: string;
  death_confirmed_doctor?: string;
  is_readmission?: boolean;
};
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
  patient_id: string;
  name: string;
  date_of_birth: string;
  year_of_birth: number;
  state_id: number;
}

export interface InventoryItemsModel {
  count?: number;
  id?: number;
  name?: string;
  default_unit?: UnitModel;
  allowed_units?: UnitModel[];
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
    id?: string;
  };
  location?: string;
  is_occupied?: boolean;
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

export interface BaseResponse {
  id: string;
  created_date: string;
  modified_date: string;
}

type UnitModel = {
  id: number;
  name: string;
};

export type IFacilityNotificationRequest = {
  facility?: string;
  message?: string;
};

export type IFacilityNotificationResponse = {
  [key: string]: string;
};

export type IStateListResponse = PaginatedResponse<UnitModel>;

export type IDistrictLocalBodyResponse = StateModel & {
  state: number;
};

export type IFacilityRequest = Omit<
  FacilityModel,
  | "id"
  | "location"
  | "local_body_object"
  | "district_object"
  | "state_object"
  | "ward_object"
  | "modified_date"
  | "created_date"
  | "facility_type"
> & {
  facility_type?: number;
  district_name?: string;
  pincode?: string;
  state?: number;
  local_body?: number;
  ward?: number;
  kasp_empanelled?: any;
  latitude?: string;
  longitude?: string;
  phone_number?: string | undefined;
};
export type IFacilityResponse = {
  id: string;
  name: string;
  local_body: number;
  district: number;
  state: number;
  ward_object: WardModel;
  local_body_object: { id: number } & LocalBodyModel;
  district_object: DistrictModel;
  state_object: StateModel;
  read_cover_image_url: string;
  features: number[];
  patient_count: string;
  bed_count: string;
  ward: number;
  facility_type: number;
  address: string;
  longitude: string;
  latitude: string;
  pincode: number;
  oxygen_capacity: number;
  phone_number: string;
  modified_date: string;
  created_date: string;
  kasp_empanelled: boolean;
  middleware_address: string;
  expected_oxygen_requirement: number;
  type_b_cylinders: number;
  type_c_cylinders: number;
  type_d_cylinders: number;
  expected_type_b_cylinders: number;
  expected_type_c_cylinders: number;
  expected_type_d_cylinders: number;
};

export type IListDoctorResponse = PaginatedResponse<{
  id: string;
  area_text: number;
  area: number;
  count: number;
}>;

export type IUserListFacilityResponse = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: number;
  doctor_qualification: string;
  doctor_experience_commenced_on: string;
  doctor_medical_council_registration: string;
  created_by: string;
  home_facility: string;
  weekly_working_hours: number;
  local_body: number;
  district: number;
  state: number;
  phone_number: string;
  alt_phone_number: string;
  gender: number;
  age: number;
  is_superuser: boolean;
  verified: boolean;
  home_facility_object: HomeFacilityModel;
  local_body_object: { id: number } & LocalBodyModel;
  district_object: DistrictModel;
  state_object: StateModel;
  pf_endpoint: string;
  pf_p256dh: string;
  pf_auth: string;
};

export type DeleteModel = {
  detail?: string;
};

export type IUserFacilityRequest = {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  doctor_qualification?: string;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
  home_facility?: string;
  weekly_working_hours?: number;
  phone_number?: string;
  alt_phone_number?: string;
  gender?: number;
  age?: number;
};

export type IUserFacilityResponse = IUserListFacilityResponse;

export type IFacilityUserResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    id: number;
    first_name: string;
    username: string;
    email: string;
    last_name: string;
    alt_phone_number: string;
    user_type: number;
    last_login: string;
    home_facility_object: HomeFacilityModel;
    doctor_qualification: string;
    doctor_experience_commenced_on: string;
    doctor_medical_council_registration: string;
    skills: {
      id: string;
      name: string;
      description: string;
    }[];
  }[];
};

export type ILocalBodyResponse = StateModel & {
  body_type: number;
  localbody_code: string;
  district: number;
};

export interface InventoryItemObjectModel {
  id: number;
  default_unit: UnitModel;
  allowed_units: UnitModel[];
  tags: UnitModel[];
  name: string;
  description: string;
  min_quantity: number;
}

export type IInventorySummaryResponse = PaginatedResponse<{
  id: string;
  item_object: InventoryItemObjectModel;
  unit_object: UnitModel;
  created_date: string;
  quantity: number;
  is_low: boolean;
  item: number;
}>;

export type IInventoryLogResponse = Omit<
  IInventorySummaryResponse,
  "results"
> & {
  results: {
    id: string;
    item_object: InventoryItemObjectModel;
    unit_object: {
      id: number;
      name: string;
    };
    external_id: string;
    current_stock: number;
    quantity_in_default_unit: number;
    is_incoming: boolean;
    probable_accident: boolean;
    created_by: number;
  }[];
};

export type IFaciclityMinimumQuantityRequest = {
  min_quantity?: number;
  item?: number;
};
export type IFaciclityMinimumQuantityResponse = {
  id: string;
  item_object: InventoryItemObjectModel;
  created_date: string;
  min_quantity: number;
  item: number;
};

interface FacilityObjectModel {
  id: string;
  name: string;
  local_body: number;
  district: number;
  state: number;
  ward_object: WardModel;
  local_body_object: { id: number } & LocalBodyModel;
  district_object: DistrictModel;
  state_object: StateModel;
  facility_type: string;
  read_cover_image_url: string;
  features: number[];
  patient_count: string;
  bed_count: string;
}

export type IPatientTransferRequest = {
  facility?: string;
  date_of_birth?: string;
};
export type IPatientTransferResponse = {
  date_of_birth: string;
  patient: string;
  facility_object: FacilityObjectModel;
};

export type IInvestigationResponse = PaginatedResponse<{
  id: string;
  group_object: {
    external_id: string;
    name: string;
  };
  investigation_object: {
    external_id: string;
    name: string;
    unit: string;
    ideal_value: string;
    min_value: number;
    max_value: number;
    investigation_type: string;
    choices: string;
  };
  session_object: {
    session_external_id: string;
    session_created_date: string;
    created_by: number;
  };
  value: number;
  notes: string;
  investigation: number;
  group: number;
  consultation: number;
  session: number;
}>;

type BedObjectModel = BaseResponse & {
  bed_type: number;
  location_object: {
    id: string;
    facility: {
      id: string;
      name: string;
    };
    created_date: string;
    modified_date: string;
    name: string;
    description: string;
    location_type: number;
  };
  is_occupied: boolean;
  name: string;
  description: string;
  meta: Record<string, string>;
};

export type IConsultationBedResponse = BaseResponse & {
  bed_object: BedObjectModel;
  assets_objects: Asset[];
  last_daily_round: string;
  start_date: string;
  end_date: string;
  meta: Record<string, string>;
};

type Asset = BaseResponse & {
  status: number;
  asset_type: number;
  location_object: {
    id: string;
    facility: {
      id: string;
      name: string;
    };
    created_date: string;
    modified_date: string;
    name: string;
    description: string;
    location_type: number;
  };
  last_service: {
    id: string;
    edits: ServiceEdit[];
    external_id: string;
    created_date: string;
    modified_date: string;
    serviced_on: string;
    note: string;
  };
  name: string;
  description: string;
  asset_class: string;
  is_working: boolean;
  not_working_reason: string;
  serial_number: string;
  warranty_details: string;
  meta: Record<string, string>;
  vendor_name: string;
  support_name: string;
  support_phone: string;
  support_email: string;
  qr_code_id: string;
  manufacturer: string;
  warranty_amc_end_of_validity: string;
};

type ServiceEdit = {
  id: string;
  edited_by: {
    id: number;
    first_name: string;
    username: string;
    email: string;
    last_name: string;
    user_type: number;
    last_login: string;
  };
  edited_on: string;
  serviced_on: string;
  note: string;
};

export type ITriageDetailResponse = BaseResponse & {
  entry_date: string;
  facility: string;
  num_patients_visited: number;
  num_patients_home_quarantine: number;
  num_patients_isolation: number;
  num_patient_referred: number;
  num_patient_confirmed_positive: number;
};

export type IMinQuantityItemResponse = {
  id: string;
  item_object: InventoryItemObjectModel;
  created_date: string;
  min_quantity: number;
  item: number;
};

export type ISetMinQuantityRequest = {
  min_quantity?: number;
  item?: number;
};
export type ISetMinQuantityResponse = IMinQuantityItemResponse;

export type IFlagInventoryItemResponse = {
  id: string;
  item_object: InventoryItemObjectModel;
  unit_object: UnitModel;
  external_id: string;
  created_date: string;
  current_stock: number;
  quantity_in_default_unit: number;
  quantity: number;
  is_incoming: boolean;
  probable_accident: boolean;
  item: number;
  unit: number;
  created_by: number;
};

export type ICreateTriageRequest = {
  entry_date?: string;
  num_patients_visited?: number;
  num_patients_home_quarantine?: number;
  num_patients_isolation?: number;
  num_patient_referred?: number;
  num_patient_confirmed_positive?: number;
};
export type ICreateTriageResponse = BaseResponse & {
  entry_date: string;
  facility: string;
  num_patients_visited: number;
  num_patients_home_quarantine: number;
  num_patients_isolation: number;
  num_patient_referred: number;
  num_patient_confirmed_positive: number;
};
