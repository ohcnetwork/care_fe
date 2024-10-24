export interface IHealthFacility {
  id: string;
  registered: boolean;
  external_id: string;
  created_date: string;
  modified_date: string;
  hf_id: string;
  facility: string;
  detail?: string;
}

export interface IcreateHealthFacilityTBody {
  facility: string;
  hf_id: string;
}

export interface IpartialUpdateHealthFacilityTBody {
  hf_id: string;
}
