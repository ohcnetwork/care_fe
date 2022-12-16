import { fireRequest, fireRequestForFiles } from "./fireRequest";

// User
export const postLogin = (params: object) => {
  return fireRequest("login", [], params);
};
export const getCurrentUser = () => {
  return fireRequest("currentUser");
};
export const signupUser = (params: object) => {
  return fireRequest("createUser", [], params);
};
export const addUser = (params: object) => {
  return fireRequest("addUser", [], params);
};
export const deleteUser = (username: string) => {
  return fireRequest("deleteUser", [username], {});
};

export const checkResetToken = (params: object) => {
  return fireRequest("checkResetToken", [], params);
};

export const postResetPassword = (form: object) => {
  return fireRequest("resetPassword", [], form);
};

export const postForgotPassword = (form: object) => {
  return fireRequest("forgotPassword", [], form);
};

export const updateUserPassword = (form: object) => {
  return fireRequest("updatePassword", [], form);
};

export const getUserPnconfig = (pathParams: object) => {
  return fireRequest("getUserPnconfig", [], {}, pathParams);
};

export const updateUserPnconfig = (params: object, pathParams: object) => {
  return fireRequest("updateUserPnconfig", [], params, pathParams);
};

// Facility
export const createFacility = (params: object) => {
  return fireRequest("createFacility", [], params);
};
export const updateFacility = (id: number, params: object) => {
  return fireRequest("updateFacility", [id], params);
};
export const partialUpdateFacility = (id: number, params: object) => {
  return fireRequest("partialUpdateFacility", [id], params);
};
export const deleteFacility = (id: number) => {
  return fireRequest("deleteFacility", [id], {});
};
export const deleteFacilityCoverImage = (id: string) => {
  return fireRequest("deleteFacilityCoverImage", [], {}, { id });
};
export const getUserList = (params: object) => {
  return fireRequest("userList", [], params);
};

export const partialUpdateUser = (username: string, data: any) => {
  return fireRequest("partialUpdateUser", [], data, { username });
};
export const getUserListFacility = (pathParam: object) => {
  return fireRequest("userListFacility", [], {}, pathParam);
};
export const addUserFacility = (username: string, facility: string) => {
  return fireRequest("addUserFacility", [], { facility }, { username });
};
export const deleteUserFacility = (username: string, facility: string) => {
  return fireRequest(
    "deleteUserFacility",
    [],
    { data: { facility } },
    { username }
  );
};
export const getPermittedFacilities = (params: object) => {
  return fireRequest("getPermittedFacilities", [], params);
};
export const getAllFacilities = (params: object) => {
  return fireRequest("getAllFacilities", [], params);
};

export const getPermittedFacility = (id: number, key?: string) => {
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
export const getOnlineDoctors = () => {
  return fireRequest("getOnlineDoctors", [], {}, {});
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
export const partialUpdateFacilityAssetLocation = (
  params: object,
  facility_external_id: string,
  external_id: string
) =>
  fireRequest("partialUpdateFacilityAssetLocation", [], params, {
    facility_external_id,
    external_id,
  });

// asset bed
export const listAssetBeds = (params: object) =>
  fireRequest("listAssetBeds", [], params, {});
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

export const getAssetBed = (
  asset_external_id: string,
  bed_id: string,
  external_id: string
) =>
  fireRequest(
    "getAssetBed",
    [],
    { asset: asset_external_id, bed: bed_id },
    { external_id }
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

export const updateAssetBed = (
  params: object,
  asset_external_id: string,
  external_id: string,
  bed_id: string
) =>
  fireRequest(
    "updateAssetBed",
    [],
    { ...params, asset: asset_external_id, bed: bed_id },
    {
      external_id,
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

// Consultation Beds
export const listConsultationBeds = (params: object) =>
  fireRequest("listConsultationBeds", [], params, {});
export const createConsultationBed = (
  params: object,
  consultation_id: number,
  bed_id: string
) =>
  fireRequest(
    "createConsultationBed",
    [],
    { ...params, consultation: consultation_id, bed: bed_id },
    {}
  );

export const getConsultationBed = (
  consultation_external_id: string,
  bed_id: string,
  external_id: string
) =>
  fireRequest(
    "getConsultationBed",
    [],
    { consultation: consultation_external_id, bed: bed_id },
    { external_id }
  );
export const updateConsultationBed = (
  params: object,
  consultation_external_id: string,
  external_id: string,
  bed_id: string
) =>
  fireRequest(
    "updateConsultationBed",
    [],
    { ...params, consultation: consultation_external_id, bed: bed_id },
    {
      external_id,
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

export const downloadPatients = () => {
  return fireRequest("downloadPatients");
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
export const searchUser = (params: object) => {
  return fireRequest("searchUser", [], params);
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
export const getPatientNotes = (
  patientId: string,
  limit: number,
  offset: number
) => {
  return fireRequest("getPatientNotes", [], { limit, offset }, { patientId });
};
export const addPatientNote = (patientId: string, params: object) => {
  return fireRequest("addPatientNote", [], params, { patientId });
};

export const getStates = () => {
  return fireRequest("statesList", []);
};
export const getStatesByText = (params: object) => {
  return fireRequest("statesList", [], params);
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
export const getLocalbodyByName = (params: object) => {
  return fireRequest("getLocalbodyByName", [], params, null);
};

export const getWardByLocalBody = (pathParam: object) => {
  return fireRequest("getWardByLocalBody", [], {}, pathParam);
};
export const getWards = (params: object) => {
  return fireRequest("getWards", [], params);
};

export const getAllLocalBodyByDistrict = (pathParam: object) => {
  return fireRequest("getAllLocalBodyByDistrict", [], {}, pathParam);
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

export const sampleSearch = (params: object) => {
  return fireRequest("getTestSampleList", [], params);
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
export const getTestSample = (id: number) => {
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
export const dailyRoundsAnalyse = (params: object, pathParam: object) => {
  return fireRequest("dailyRoundsAnalyse", [], params, pathParam);
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
export const getItemName = (id: number) => {
  return fireRequest("getItemName", [id], {});
};

export const flagInventoryItem = (params: object) => {
  return fireRequest("flagInventoryItem", [], {}, params);
};

export const deleteLastInventoryLog = (params: object) => {
  return fireRequest("deleteLastInventoryLog", [], {}, params);
};

export const discharge = (params: object, pathParams: object) => {
  return fireRequest("discharge", [], params, pathParams);
};
export const dischargePatient = (params: object, pathParams: object) => {
  return fireRequest("dischargePatient", [], params, pathParams);
};

//Profile

export const checkUsername = (params: object) => {
  return fireRequest("checkUsername", [], {}, params, undefined, true);
};

export const getUserDetails = (username: string, suppress?: boolean) => {
  return fireRequest(
    "getUserDetails",
    [],
    {},
    { username: username },
    undefined,
    suppress ?? true
  );
};
export const updateUserDetails = (username: string, data: object) => {
  return fireRequest("updateUserDetails", [username], data);
};

//Shift
export const createShift = (params: object) => {
  return fireRequest("createShift", [], params);
};
export const updateShift = (id: string, params: object) => {
  return fireRequest("updateShift", [id], params);
};
export const deleteShiftRecord = (id: string) => {
  return fireRequest("deleteShiftRecord", [id], {});
};
export const listShiftRequests = (params: object, key: string) => {
  return fireRequest("listShiftRequests", [], params, null, key);
};
export const getShiftDetails = (pathParam: object) => {
  return fireRequest("getShiftDetails", [], {}, pathParam);
};
export const completeTransfer = (pathParams: object) => {
  return fireRequest("completeTransfer", [], {}, pathParams);
};
export const downloadShiftRequests = (params: object) => {
  return fireRequest("downloadShiftRequests", [], params);
};
export const getShiftComments = (id: string) => {
  return fireRequest("getShiftComments", [], {}, { id });
};
export const addShiftComments = (id: string, params: object) => {
  return fireRequest("addShiftComments", [], params, { id });
};
// External Results
export const externalResultList = (params: object, altKey: string) => {
  return fireRequest("externalResultList", [], params, null, altKey);
};

export const externalResult = (pathParam: object) => {
  return fireRequest("externalResult", [], {}, pathParam);
};
export const externalResultUploadCsv = (params: object) => {
  return fireRequest("externalResultUploadCsv", [], params);
};

export const deleteExternalResult = (id: string) => {
  return fireRequest("deleteExternalResult", [id], {});
};

export const updateExternalResult = (id: number, params: object) => {
  return fireRequest("updateExternalResult", [], params, { id });
};

export const partialUpdateExternalResult = (id: number, params: object) => {
  return fireRequest("partialUpdateExternalResult", [], params, { id });
};

// Notifications
export const getNotifications = (params: object) => {
  return fireRequest("getNotifications", [], params);
};

export const getNotificationData = (pathParam: object) => {
  return fireRequest("getNotificationData", [], {}, pathParam);
};

export const markNotificationAsRead = (id: string) => {
  return fireRequest(
    "markNotificationAsRead",
    [],
    { read_at: new Date() },
    { id }
  );
};

export const getPublicKey = () => {
  return fireRequest("getPublicKey", [], {}, {});
};

export const sendNotificationMessages = (params: object) => {
  return fireRequest("sendNotificationMessages", [], params, {});
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

export const retrieveUploadFilesURL = (params: object, fileId: string) => {
  return fireRequestForFiles("retrieveUpload", [], params, { fileId: fileId });
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
export const listICD11Diagnosis = (params: object, key: string) => {
  return fireRequest("listICD11Diagnosis", [], params, null, key);
};

// Resource
export const createResource = (params: object) => {
  return fireRequest("createResource", [], params);
};
export const updateResource = (id: string, params: object) => {
  return fireRequest("updateResource", [id], params);
};
export const deleteResourceRecord = (id: string) => {
  return fireRequest("deleteResourceRecord", [id], {});
};
export const listResourceRequests = (params: object, key: string) => {
  return fireRequest("listResourceRequests", [], params, null, key);
};
export const getResourceDetails = (pathParam: object) => {
  return fireRequest("getResourceDetails", [], {}, pathParam);
};
export const downloadResourceRequests = (params: object) => {
  return fireRequest("downloadResourceRequests", [], params);
};
export const getResourceComments = (id: string, params: object) => {
  return fireRequest("getResourceComments", [], params, { id });
};
export const addResourceComments = (id: string, params: object) => {
  return fireRequest("addResourceComments", [], params, { id });
};

export const listAssets = (params: object) =>
  fireRequest("listAssets", [], params);
export const createAsset = (params: object) =>
  fireRequest("createAsset", [], params);
export const getAssetUserLocation = (params: object) =>
  fireRequest("getAssetUserLocation", [], params);
export const createAssetUserLocation = (params: object) =>
  fireRequest("createAssetUserLocation", [], params);
export const getAsset = (id: string) =>
  fireRequest("getAsset", [], {}, { external_id: id });
export const updateAsset = (id: string, params: object) =>
  fireRequest("updateAsset", [], params, { external_id: id });
export const partialUpdateAsset = (id: string, params: object) =>
  fireRequest("partialUpdateAsset", [], params, { external_id: id });
export const operateAsset = (id: string, params: object) =>
  fireRequest("operateAsset", [], params, { external_id: id });

export const listAssetTransaction = (params: object) =>
  fireRequest("listAssetTransaction", [], params);
export const getAssetTransaction = (id: string) =>
  fireRequest("getAssetTransaction", [], {}, { id });
