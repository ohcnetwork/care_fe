import { fireRequest } from "./fireRequest";

// asset bed
export const listAssetBeds = (params: object, altKey?: string) =>
  fireRequest("listAssetBeds", [], params, {}, altKey);

export const partialUpdateAssetBed = (params: object, asset_id: string) =>
  fireRequest(
    "partialUpdateAssetBed",
    [],
    { ...params },
    {
      external_id: asset_id,
    },
  );

export const deleteAssetBed = (asset_id: string) =>
  fireRequest(
    "deleteAssetBed",
    [],
    {},
    {
      external_id: asset_id,
    },
  );

// Download Actions
export const downloadFacility = () => {
  return fireRequest("downloadFacility");
};

export const downloadFacilityCapacity = () => {
  return fireRequest("downloadFacilityCapacity");
};

export const downloadFacilityDoctors = () => {
  return fireRequest("downloadFacilityDoctors");
};

export const downloadFacilityTriage = () => {
  return fireRequest("downloadFacilityTriage");
};

//Patient
export const getAllPatient = (params: object, altKey: string) => {
  return fireRequest("patientList", [], params, null, altKey);
};
export const getPatient = (pathParam: object) => {
  return fireRequest("getPatient", [], {}, pathParam);
};

// District/State/Local body/ward
export const getDistrictByName = (params: object) => {
  return fireRequest("getDistrictByName", [], params, null);
};

// Sample Test
export const downloadSampleTests = (params: object) => {
  return fireRequest("getTestSampleList", [], { ...params, csv: 1 });
};

// Consultation
export const getConsultation = (id: string) => {
  return fireRequest("getConsultation", [], {}, { id: id });
};

export const dischargePatient = (params: object, pathParams: object) => {
  return fireRequest("dischargePatient", [], params, pathParams);
};

//Shift
export const listShiftRequests = (params: object, key: string) => {
  return fireRequest("listShiftRequests", [], params, null, key);
};

export const downloadShiftRequests = (params: object) => {
  return fireRequest("downloadShiftRequests", [], params);
};

// External Results
export const externalResultList = (params: object, altKey: string) => {
  return fireRequest("externalResultList", [], params, null, altKey);
};

// Resource
export const downloadResourceRequests = (params: object) => {
  return fireRequest("downloadResourceRequests", [], params);
};

export const listAssets = (params: object) =>
  fireRequest("listAssets", [], params);
export const operateAsset = (id: string, params: object) =>
  fireRequest("operateAsset", [], params, { external_id: id });
