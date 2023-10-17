export interface IExternalResultUploadCsv {
  sample_tests: any[];
}

export interface IExternalResult {
  id: number;
  name: string;
  age: number;
  age_in: string;
  test_type: string;
  result: string;
  result_date: string;
  patient_created: boolean;
  gender: string;
  source: string;
  is_repeat: boolean;
  mobile_number: string;
  patient_status: string;
  sample_type: string;
  sample_collection_date: string;
  patient_category: string;
  srf_id: string;
  district_object: {
    id: number;
    name: string;
    state: number;
  };
  district: number;
  ward: number;
  local_body: number;
  address: string;
  ward_object: {
    id: number;
    number: number;
    name: string;
  };
  local_body_object: {
    id: number;
    name: string;
  };
}

export interface ILocalBodies {
  id: number;
  name: string;
  state: number;
  number: number;
  body_type: number;
  localbody_code: string;
  district: number;
}

export interface IDeleteExternalResult {
  detail: string;
}

export interface IPartialUpdateExternalResult {
  address: string;
  ward: number;
  local_body: number;
  patient_created: boolean;
}

export interface ILocalBodyByDistrict {
  id: number;
  name: string;
  state: number;
}

export interface IExternalResultCsv {
  sample_tests: Partial<IExternalResult>[];
}
