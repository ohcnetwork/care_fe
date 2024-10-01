import { fireRequest } from "./fireRequest";

export const getPatient = (pathParam: object) => {
  return fireRequest("getPatient", [], {}, pathParam);
};

// District/State/Local body/ward
export const getDistrictByName = (params: object) => {
  return fireRequest("getDistrictByName", [], params, null);
};

// Consultation
export const getConsultation = (id: string) => {
  return fireRequest("getConsultation", [], {}, { id: id });
};

export const dischargePatient = (params: object, pathParams: object) => {
  return fireRequest("dischargePatient", [], params, pathParams);
};
