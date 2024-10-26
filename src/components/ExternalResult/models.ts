export interface ILocalBodies {
  id: number;
  name: string;
  state: number;
  number: number;
  body_type: number;
  localbody_code: string;
  district: number;
}
export interface IDeleteBedCapacity {
  detail: string;
}

export interface ILocalBodyByDistrict {
  id: number;
  name: string;
  state: number;
}
