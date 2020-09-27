import { fireRequest } from "./fireRequest";

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

export const postResetPassword = (form: object) => {
  return fireRequest("resetPassword", [], form);
};

export const postForgotPassword = (form: object) => {
  return fireRequest("forgotPassword", [], form);
};

// Facility
export const createFacility = (params: object) => {
  return fireRequest("createFacility", [], params);
};
export const updateFacility = (id: number, params: object) => {
  return fireRequest("updateFacility", [id], params);
};
export const getUserList = (params: object) => {
  return fireRequest("userList", [], params);
};
export const getFacilities = (params: object) => {
  return fireRequest("listFacility", [], params);
};
export const getAllFacilities = (params: object) => {
  return fireRequest("getAllFacilitiesList", [], params);
};

export const getFacility = (id: number, key?: string) => {
  return fireRequest("getFacility", [id], {}, null, key);
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
export const createTriageForm = (params: object, pathParam: object) => {
  return fireRequest("createTriage", [], params, pathParam);
};
export const getTriageInfo = (pathParam: object) => {
  return fireRequest("getTriage", [], {}, pathParam);
};
export const getTriageDetails = (id: number, pathParam: object) => {
  return fireRequest("getTriage", [id], {}, pathParam);
};
export const listCapacity = (params: object, pathParam: object) => {
  return fireRequest("getCapacity", [], params, pathParam);
};
export const listDoctor = (params: object, pathParam: object) => {
  return fireRequest("getDoctor", [], params, pathParam);
};
export const getCapacity = (id: number, pathParam: object) => {
  return fireRequest("getCapacity", [id], {}, pathParam);
};
export const getDoctor = (id: number, pathParam: object) => {
  return fireRequest("getDoctor", [id], {}, pathParam);
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
export const getStates = () => {
  return fireRequest("statesList", []);
};

// District/State/Local body/ward
export const getDistrictByState = (pathParam: object) => {
  return fireRequest("getDistrictByState", [], {}, pathParam);
};
export const getLocalbodyByDistrict = (pathParam: object) => {
  return fireRequest("getLocalbodyByDistrict", [], {}, pathParam);
};
export const getWardByLocalBody = (pathParam: object) => {
  return fireRequest("getWardByLocalBody", [], {}, pathParam);
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
export const patchSample = (id: any, params: object) => {
  return fireRequest("patchSample", [id], params);
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
export const getConsultationDailyRoundsDetails = (
  id: number,
  pathParam: object
) => {
  return fireRequest("getDailyReports", [id], {}, pathParam);
};

// Consultation
export const createConsultation = (params: object) => {
  return fireRequest("createConsultation", [], params);
};
export const getConsultationList = (params: object) => {
  return fireRequest("getConsultationList", [], params);
};
export const getConsultation = (id: number) => {
  return fireRequest("getConsultation", [id], {});
};
export const updateConsultation = (id: number, params: object) => {
  return fireRequest("updateConsultation", [id], params);
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
export const discharge = (params: object, pathParams: object) => {
  return fireRequest("discharge", [], params, pathParams);
};
export const dischargePatient = (params: object, pathParams: object) => {
  return fireRequest("dischargePatient", [], params, pathParams);
};

//Profile
export const getUserDetails = (username: string) => {
  return fireRequest("getUserDetails", [username]);
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
export const getShiftRequests = (params: object, key: string) => {
  return fireRequest(`getShiftRequests`, [], params, null, key);
};
export const getShiftDetails = (id: string) => {
  return fireRequest("getShiftDetails", [id], {});
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
export const externalResult = (id: string) => {
  return fireRequest("externalResult", [id], {});
};
