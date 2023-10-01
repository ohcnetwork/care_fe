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
}

export interface IExternalResultList {
  count: number;
  results: IExternalResult[];
}
