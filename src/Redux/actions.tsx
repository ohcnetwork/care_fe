import { HCXClaimModel, HCXPolicyModel } from "../Components/HCX/models";
import { MedibaseMedicine } from "../Components/Medicine/models";
import { fireRequest } from "./fireRequest";

// Facility
export const getUserList = (params: object, key?: string) => {
  return fireRequest("userList", [], params, null, key);
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
export const patchPatient = (params: object, pathParam: object) => {
  return fireRequest("patchPatient", [], params, pathParam);
};

// District/State/Local body/ward
export const getDistrictByName = (params: object) => {
  return fireRequest("getDistrictByName", [], params, null);
};

// Sample Test
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
export const getConsultation = (id: string) => {
  return fireRequest("getConsultation", [], {}, { id: id });
};
export const updateConsultation = (id: string, params: object) => {
  return fireRequest("updateConsultation", [], params, { id: id });
};
export const partialUpdateConsultation = (id: string, params: object) => {
  return fireRequest("partialUpdateConsultation", [], params, { id: id });
}

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

export const externalResult = (pathParam: object) => {
  return fireRequest("externalResult", [], {}, pathParam);
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
export const operateAsset = (id: string, params: object) =>
  fireRequest("operateAsset", [], params, { external_id: id });

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
