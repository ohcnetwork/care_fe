import { HCXClaimModel, HCXPolicyModel } from "../Components/HCX/models";
import { MedibaseMedicine } from "../Components/Medicine/models";
import { fireRequest } from "./fireRequest";

// Facility
export const createFacility = (params: object) => {
  return fireRequest("createFacility", [], params);
};
export const updateFacility = (id: string, params: object) => {
  return fireRequest("updateFacility", [id], params);
};
export const deleteFacilityCoverImage = (id: string) => {
  return fireRequest("deleteFacilityCoverImage", [], {}, { id });
};
export const getUserList = (params: object, key?: string) => {
  return fireRequest("userList", [], params, null, key);
};

export const getPermittedFacilities = (params: object) => {
  return fireRequest("getPermittedFacilities", [], params);
};

export const getAllSkills = (params: object) => {
  return fireRequest("getAllSkills", [], params);
};

export const getPermittedFacility = (id: number | string, key?: string) => {
  return fireRequest("getPermittedFacility", [], {}, { id: id }, key);
};

export const getAnyFacility = (id: number | string, key?: string) => {
  return fireRequest("getAnyFacility", [], {}, { id: id }, key);
};

export const getFacilityUsers = (id: string, params?: object) => {
  return fireRequest(
    "getFacilityUsers",
    [],
    { ...params },
    { facility_id: id }
  );
};

export const listFacilityAssetLocation = (params: object, pathParam: object) =>
  fireRequest("listFacilityAssetLocation", [], params, pathParam);
export const createFacilityAssetLocation = (
  params: object,
  facility_id: string
) =>
  fireRequest("createFacilityAssetLocation", [], params, {
    facility_external_id: facility_id,
  });
export const getFacilityAssetLocation = (
  facility_external_id: string,
  external_id: string
) =>
  fireRequest(
    "getFacilityAssetLocation",
    [],
    {},
    { facility_external_id, external_id }
  );
export const updateFacilityAssetLocation = (
  params: object,
  facility_external_id: string,
  external_id: string
) =>
  fireRequest("updateFacilityAssetLocation", [], params, {
    facility_external_id,
    external_id,
  });

// asset bed
export const listAssetBeds = (params: object, altKey?: string) =>
  fireRequest("listAssetBeds", [], params, {}, altKey);
export const createAssetBed = (
  params: object,
  asset_id: string,
  bed_id: string
) =>
  fireRequest(
    "createAssetBed",
    [],
    { ...params, asset: asset_id, bed: bed_id },
    {}
  );

export const partialUpdateAssetBed = (params: object, asset_id: string) =>
  fireRequest(
    "partialUpdateAssetBed",
    [],
    { ...params },
    {
      external_id: asset_id,
    }
  );

export const deleteAssetBed = (asset_id: string) =>
  fireRequest(
    "deleteAssetBed",
    [],
    {},
    {
      external_id: asset_id,
    }
  );

export const listPatientAssetBeds = (
  facility_external_id: string,
  params: object
) => fireRequest("listPatientAssetBeds", [], params, { facility_external_id });

// Facility Beds
export const listFacilityBeds = (params: object) =>
  fireRequest("listFacilityBeds", [], params, {});
export const createFacilityBed = (
  params: object,
  facility_id: string,
  location_id: string
) =>
  fireRequest(
    "createFacilityBed",
    [],
    { ...params, facility: facility_id, location: location_id },
    {}
  );

export const getFacilityBed = (
  facility_external_id: string,
  location_id: string,
  external_id: string
) =>
  fireRequest(
    "getFacilityBed",
    [],
    { facility: facility_external_id, location: location_id },
    { external_id }
  );
export const updateFacilityBed = (
  params: object,
  facility_external_id: string,
  external_id: string,
  location_id: string
) =>
  fireRequest(
    "updateFacilityBed",
    [],
    { ...params, facility: facility_external_id, location: location_id },
    {
      external_id,
    }
  );
export const deleteFacilityBed = (external_id: string) => {
  return fireRequest("deleteFacilityBed", [], {}, { external_id });
};

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

// Capacity/Triage/Doctor
export const createCapacity = (
  id: number | undefined,
  params: object,
  pathParam: object
) => {
  return id
    ? fireRequest("updateCapacity", [id], params, pathParam)
    : fireRequest("createCapacity", [], params, pathParam);
};
export const createDoctor = (
  id: number | undefined,
  params: object,
  pathParam: object
) => {
  return id
    ? fireRequest("updateDoctor", [id], params, pathParam)
    : fireRequest("createDoctor", [], params, pathParam);
};
export const deleteDoctor = (id: number, pathParam: object) => {
  return fireRequest("deleteDoctor", [id], {}, pathParam);
};
export const createTriageForm = (params: object, pathParam: object) => {
  return fireRequest("createTriage", [], params, pathParam);
};
export const getTriageInfo = (pathParam: object) => {
  return fireRequest("getTriage", [], {}, pathParam);
};
export const getTriageDetails = (pathParam: object) => {
  return fireRequest("getTriageDetails", [], {}, pathParam);
};
export const listCapacity = (params: object, pathParam: object) => {
  return fireRequest("getCapacity", [], params, pathParam);
};
export const listDoctor = (params: object, pathParam: object) => {
  return fireRequest("listDoctor", [], params, pathParam);
};
export const getCapacity = (id: number, pathParam: object) => {
  return fireRequest("getCapacity", [id], {}, pathParam);
};

export const getCapacityBed = (pathParam: object) => {
  return fireRequest("getCapacityBed", [], {}, pathParam);
};

export const getDoctor = (pathParam: object) => {
  return fireRequest("getDoctor", [], {}, pathParam);
};
export const deleteCapacity = (pathParam: object) => {
  return fireRequest("deleteCapacityBed", [], {}, pathParam);
};

//Patient
export const searchPatient = (params: object) => {
  return fireRequest("searchPatient", [], params);
};
export const getAllPatient = (params: object, altKey: string) => {
  return fireRequest("patientList", [], params, null, altKey);
};
export const createPatient = (params: object) => {
  return fireRequest("addPatient", [], params);
};
export const getPatient = (pathParam: object) => {
  return fireRequest("getPatient", [], {}, pathParam);
};
export const updatePatient = (params: object, pathParam: object) => {
  return fireRequest("updatePatient", [], params, pathParam);
};
export const patchPatient = (params: object, pathParam: object) => {
  return fireRequest("patchPatient", [], params, pathParam);
};
export const transferPatient = (params: object, pathParam: object) => {
  return fireRequest("transferPatient", [], params, pathParam);
};
export const getStates = () => {
  return fireRequest("statesList", []);
};
export const getState = (id: number) => {
  return fireRequest("getState", [], {}, { id: id });
};

// District/State/Local body/ward
export const getDistrictByState = (pathParam: object) => {
  return fireRequest("getDistrictByState", [], {}, pathParam);
};
export const getDistrictByName = (params: object) => {
  return fireRequest("getDistrictByName", [], params, null);
};
export const getDistrict = (id: number, key?: string) => {
  return fireRequest("getDistrict", [], {}, { id: id }, key);
};

export const getLocalbodyByDistrict = (pathParam: object) => {
  return fireRequest("getLocalbodyByDistrict", [], {}, pathParam);
};

export const getWardByLocalBody = (pathParam: object) => {
  return fireRequest("getWardByLocalBody", [], {}, pathParam);
};

// Local Body
export const getLocalBody = (pathParam: object) => {
  return fireRequest("getLocalBody", [], {}, pathParam);
};
export const getAllLocalBody = (params: object) => {
  return fireRequest("getAllLocalBody", [], params);
};

// Sample Test
export const getSampleTestList = (params: object, pathParam: object) => {
  return fireRequest("sampleTestList", [], params, pathParam);
};
export const createSampleTest = (params: object, pathParam: object) => {
  return fireRequest("createSampleTest", [], params, pathParam);
};
export const sampleReport = (id: string, sampleId: string) => {
  return fireRequest("sampleReport", [], {}, { id, sampleId });
};
export const getTestList = (params: object) => {
  return fireRequest("getTestSampleList", [], params);
};
export const getTestSample = (id: string) => {
  return fireRequest("getTestSample", [id], {});
};
export const patchSample = (params: object, pathParam: object) => {
  return fireRequest("patchSample", [], params, pathParam);
};
export const downloadSampleTests = (params: object) => {
  return fireRequest("getTestSampleList", [], { ...params, csv: 1 });
};

// Daily Rounds

export const createDailyReport = (params: object, pathParam: object) => {
  return fireRequest("createDailyRounds", [], params, pathParam);
};
export const updateDailyReport = (params: object, pathParam: object) => {
  return fireRequest("updateDailyReport", [], params, pathParam);
};
export const getDailyReport = (params: object, pathParam: object) => {
  return fireRequest("getDailyReports", [], params, pathParam);
};
export const getConsultationDailyRoundsDetails = (pathParam: object) => {
  return fireRequest("getDailyReport", [], {}, pathParam);
};

// Consultation
export const createConsultation = (params: object) => {
  return fireRequest("createConsultation", [], params);
};
export const getConsultationList = (params: object) => {
  return fireRequest("getConsultationList", [], params);
};
export const getConsultation = (id: number) => {
  return fireRequest("getConsultation", [], {}, { id: id });
};
export const updateConsultation = (id: number, params: object) => {
  return fireRequest("updateConsultation", [], params, { id: id });
};
//Inventory
export const getItems = (params: object) => {
  return fireRequest("getItems", [], params);
};
export const postInventory = (params: object, pathParams: object) => {
  return fireRequest("createInventory", [], params, pathParams);
};
export const getInventoryLog = (params: object, pathParams: object) => {
  return fireRequest("getInventoryLog", [params, "inventory"], pathParams);
};
export const setMinQuantity = (params: object, pathParams: object) => {
  return fireRequest("setMinQuantity", [], params, pathParams);
};
export const getMinQuantity = (facilityId: object, params: object) => {
  return fireRequest("getMinQuantity", [facilityId, "min_quantity"], params);
};

export const getMinQuantityOfItem = (
  facilityId: object,
  externalId: object
) => {
  return fireRequest("getMinQuantity", [
    facilityId,
    "min_quantity",
    externalId,
  ]);
};

export const updateMinQuantity = (pathParams: object, params: object) => {
  return fireRequest("updateMinQuantity", [], pathParams, params);
};
export const getInventorySummary = (facilityId: number, params: object) => {
  return fireRequest(
    "getInventorySummary",
    [facilityId, "inventorysummary"],
    params
  );
};
export const flagInventoryItem = (params: object) => {
  return fireRequest("flagInventoryItem", [], {}, params);
};

export const deleteLastInventoryLog = (params: object) => {
  return fireRequest("deleteLastInventoryLog", [], {}, params);
};

export const generateDischargeSummary = (pathParams: object) => {
  return fireRequest("dischargeSummaryGenerate", [], {}, pathParams);
};
export const previewDischargeSummary = (pathParams: object) => {
  return fireRequest(
    "dischargeSummaryPreview",
    [],
    {},
    pathParams,
    undefined,
    true
  );
};
export const emailDischargeSummary = (params: object, pathParams: object) => {
  return fireRequest("dischargeSummaryEmail", [], params, pathParams);
};
export const dischargePatient = (params: object, pathParams: object) => {
  return fireRequest("dischargePatient", [], params, pathParams);
};

//Shift
export const createShift = (params: object) => {
  return fireRequest("createShift", [], params);
};

export const listShiftRequests = (params: object, key: string) => {
  return fireRequest("listShiftRequests", [], params, null, key);
};

export const completeTransfer = (pathParams: object) => {
  return fireRequest("completeTransfer", [], {}, pathParams);
};
export const downloadShiftRequests = (params: object) => {
  return fireRequest("downloadShiftRequests", [], params);
};

// External Results
export const externalResultList = (params: object, altKey: string) => {
  return fireRequest("externalResultList", [], params, null, altKey);
};

export const externalResult = (pathParam: object) => {
  return fireRequest("externalResult", [], {}, pathParam);
};

// FileUpload

export const createUpload = (params: object) => {
  return fireRequest("createUpload", [], params);
};

export const viewUpload = (params: object) => {
  return fireRequest("viewUpload", [], params);
};

export const retrieveUpload = (params: object, fileId: string) => {
  return fireRequest("retrieveUpload", [], params, { fileId: fileId });
};

export const editUpload = (
  params: object,
  fileId: string,
  fileType: string,
  associatingId: string
) => {
  return fireRequest("editUpload", [], params, {
    fileId,
    fileType,
    associatingId,
  });
};

// Investigation

export const listInvestigations = (
  params: object,
  altKey = "listInvestigations"
) => {
  return fireRequest("listInvestigations", [], params, null, altKey);
};

export const listInvestigationGroups = (params: object) => {
  return fireRequest("listInvestigationGroups", [], params);
};

export const createInvestigation = (
  params: object,
  consultation_external_id: string
) => {
  return fireRequest("createInvestigation", [], params, {
    consultation_external_id: consultation_external_id,
  });
};

export const getInvestigationSessions = (
  params: object,
  consultation_external_id: string
) => {
  return fireRequest("getInvestigationSessions", [], params, {
    consultation_external_id: consultation_external_id,
  });
};

export const getInvestigation = (
  params: object,
  consultation_external_id: string
) => {
  return fireRequest("getInvestigation", [], params, {
    consultation_external_id: consultation_external_id,
  });
};

export const getPatientInvestigation = (
  params: object,
  patient_external_id: string
) => {
  return fireRequest("getPatientInvestigation", [], params, {
    patient_external_id: patient_external_id,
  });
};

export const editInvestigation = (
  params: object,
  consultation_external_id: string
) => {
  return fireRequest("editInvestigation", [], params, {
    consultation_external_id: consultation_external_id,
  });
};

// ICD11
export const listICD11Diagnosis = (params: object) => {
  return fireRequest("listICD11Diagnosis", [], params, null);
};
// Medibase
export const listMedibaseMedicines = (
  query: string,
  type?: MedibaseMedicine["type"]
) => {
  return fireRequest("listMedibaseMedicines", [], { query, type });
};

// Resource
export const downloadResourceRequests = (params: object) => {
  return fireRequest("downloadResourceRequests", [], params);
};

export const listAssets = (params: object) =>
  fireRequest("listAssets", [], params);
export const createAsset = (params: object) =>
  fireRequest("createAsset", [], params);
export const getAsset = (id: string) =>
  fireRequest("getAsset", [], {}, { external_id: id });
export const updateAsset = (id: string, params: object) =>
  fireRequest("updateAsset", [], params, { external_id: id });
export const operateAsset = (id: string, params: object) =>
  fireRequest("operateAsset", [], params, { external_id: id });

export const listAssetAvailability = (params: object) =>
  fireRequest("listAssetAvailability", [], params);

export const listPMJYPackages = (query?: string) =>
  fireRequest("listPMJYPackages", [], { query });

// HCX Actions
export const HCXActions = {
  checkEligibility: (policy: string) => {
    return fireRequest("hcxCheckEligibility", [], { policy });
  },

  payors: {
    list(query: string) {
      return fireRequest("hcxListPayors", [], { query });
    },
  },

  policies: {
    list(params: object) {
      return fireRequest("listHCXPolicies", [], params);
    },
    create(obj: HCXPolicyModel) {
      return fireRequest("createHCXPolicy", [], obj);
    },
    read(id: string) {
      return fireRequest("getHCXPolicy", [], {}, { external_id: id });
    },
    update(id: string, obj: HCXPolicyModel) {
      return fireRequest("updateHCXPolicy", [], obj, { external_id: id });
    },
    partialUpdate(id: string, obj: Partial<HCXPolicyModel>) {
      return fireRequest("partialUpdateHCXPolicy", [], obj, {
        external_id: id,
      });
    },
    delete(id: string) {
      return fireRequest("deleteHCXPolicy", [], {}, { external_id: id });
    },
  },

  claims: {
    list(params: object) {
      return fireRequest("listHCXClaims", [], params);
    },
    create(obj: object) {
      return fireRequest("createHCXClaim", [], obj);
    },
    read(id: string) {
      return fireRequest("getHCXClaim", [], {}, { external_id: id });
    },
    update(id: string, obj: HCXClaimModel) {
      return fireRequest("updateHCXClaim", [], obj, { external_id: id });
    },
    partialUpdate(id: string, obj: Partial<HCXClaimModel>) {
      return fireRequest("partialUpdateHCXClaim", [], obj, {
        external_id: id,
      });
    },
    delete(id: string) {
      return fireRequest("deleteHCXClaim", [], {}, { external_id: id });
    },
  },

  preauths: {
    list(consultation: string) {
      return fireRequest(
        "listHCXClaims",
        [],
        {
          consultation,
          ordering: "-modified_date",
          use: "preauthorization",
        },
        {},
        `listPreAuths-${consultation}`
      );
    },
  },

  makeClaim(claim: string) {
    return fireRequest("hcxMakeClaim", [], { claim });
  },
};
