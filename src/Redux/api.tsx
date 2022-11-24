interface Route {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  noAuth?: boolean;
}

interface Routes {
  [name: string]: Route;
}

const routes: Routes = {
  // Auth Endpoints
  login: {
    path: "/api/v1/auth/login/",
    method: "POST",
    noAuth: true,
  },

  token_refresh: {
    path: "/api/v1/auth/token/refresh",
    method: "POST",
  },

  token_verify: {
    path: "/api/v1/auth/token/verify",
    method: "POST",
  },

  checkResetToken: {
    path: "/api/v1/password_reset/check/",
    method: "POST",
  },

  resetPassword: {
    path: "/api/v1/password_reset/confirm/",
    method: "POST",
  },

  forgotPassword: {
    path: "/api/v1/password_reset/",
    method: "POST",
  },

  updatePassword: {
    path: "/api/v1/password_change/",
    method: "PUT",
  },
  // User Endpoints
  currentUser: {
    path: "/api/v1/users/getcurrentuser/",
  },

  userList: {
    path: "/api/v1/users/",
  },

  userListFacility: {
    path: "/api/v1/users/{username}/get_facilities/",
  },

  addUserFacility: {
    path: "/api/v1/users/{username}/add_facility/",
    method: "PUT",
  },

  deleteUserFacility: {
    path: "/api/v1/users/{username}/delete_facility/",
    method: "DELETE",
  },

  createUser: {
    path: "/api/v1/users/",
    method: "POST",
    noAuth: true,
  },

  updateUser: {
    path: "/api/v1/users",
    method: "PUT",
  },

  partialUpdateUser: {
    path: "/api/v1/users/{username}/",
    method: "PATCH",
  },

  deleteUser: {
    path: "/api/v1/users",
    method: "DELETE",
  },

  addUser: {
    path: "/api/v1/users/add_user/",
    method: "POST",
  },

  searchUser: {
    path: "/api/v1/users/",
  },

  getOnlineDoctors: {
    path: "/api/v1/users/?user_type=Doctor&ordering=-last_login",
  },

  getUserPnconfig: {
    path: "/api/v1/users/{username}/pnconfig/",
  },

  updateUserPnconfig: {
    path: "/api/v1/users/{username}/pnconfig/",
    method: "PATCH",
  },

  // Facility Endpoints

  getPermittedFacilities: {
    path: "/api/v1/facility/",
  },

  getAllFacilities: {
    path: "/api/v1/getallfacilities",
  },

  createFacility: {
    path: "/api/v1/facility/",
    method: "POST",
  },

  getPermittedFacility: {
    path: "/api/v1/facility/{id}/",
  },

  getAnyFacility: {
    path: "/api/v1/getallfacilities/{id}/",
  },

  updateFacility: {
    path: "/api/v1/facility",
    method: "PUT",
  },

  partialUpdateFacility: {
    path: "/api/v1/facility",
    method: "PATCH",
  },

  deleteFacilityCoverImage: {
    path: "/api/v1/facility/{id}/cover_image/",
    method: "DELETE",
  },

  getFacilityUsers: {
    path: "/api/v1/facility/{facility_id}/get_users/",
  },

  listFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/",
    method: "GET",
  },
  createFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/",
    method: "POST",
  },
  getFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/",
    method: "GET",
  },
  updateFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/",
    method: "PUT",
  },
  partialUpdateFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/",
    method: "PATCH",
  },

  // Asset bed
  listAssetBeds: {
    path: "/api/v1/assetbed/",
    method: "GET",
  },
  createAssetBed: {
    path: "/api/v1/assetbed/",
    method: "POST",
  },
  getAssetBed: {
    path: "/api/v1/assetbed/{external_id}/",
    method: "GET",
  },
  updateAssetBed: {
    path: "/api/v1/assetbed/{external_id}/",
    method: "PUT",
  },
  partialUpdateAssetBed: {
    path: "/api/v1/assetbed/{external_id}/",
    method: "PATCH",
  },
  deleteAssetBed: {
    path: "/api/v1/assetbed/{external_id}/",
    method: "DELETE",
  },
  operateAsset: {
    path: "/api/v1/asset/{external_id}/operate_assets/",
    method: "POST",
  },

  // Facility Beds
  listFacilityBeds: {
    path: "/api/v1/bed/",
    method: "GET",
  },
  createFacilityBed: {
    path: "/api/v1/bed/",
    method: "POST",
  },
  getFacilityBed: {
    path: "/api/v1/bed/{external_id}/",
    method: "GET",
  },
  updateFacilityBed: {
    path: "/api/v1/bed/{external_id}/",
    method: "PUT",
  },
  deleteFacilityBed: {
    path: "/api/v1/bed/{external_id}/",
    method: "DELETE",
  },

  // Consultation beds

  listConsultationBeds: {
    path: "/api/v1/consultationbed/",
    method: "GET",
  },
  createConsultationBed: {
    path: "/api/v1/consultationbed/",
    method: "POST",
  },
  getConsultationBed: {
    path: "/api/v1/consultationbed/{external_id}/",
    method: "GET",
  },
  updateConsultationBed: {
    path: "/api/v1/consultationbed/{external_id}/",
    method: "PUT",
  },

  // Download Api
  deleteFacility: {
    path: "/api/v1/facility",
    method: "DELETE",
  },

  downloadFacility: {
    path: "/api/v1/facility/?csv",
    method: "GET",
  },
  downloadFacilityCapacity: {
    path: "/api/v1/facility/?csv&capacity",
    method: "GET",
  },
  downloadFacilityDoctors: {
    path: "/api/v1/facility/?csv&doctors",
    method: "GET",
  },

  downloadFacilityTriage: {
    path: "/api/v1/facility/?csv&triage",
    method: "GET",
  },

  downloadPatients: {
    path: "/api/v1/patient/?csv",
    method: "GET",
  },
  getConsultationList: {
    path: "/api/v1/consultation/",
  },
  createConsultation: {
    path: "/api/v1/consultation/",
    method: "POST",
  },
  getConsultation: {
    path: "/api/v1/consultation/{id}/",
  },
  updateConsultation: {
    path: "/api/v1/consultation/{id}/",
    method: "PUT",
  },
  partialUpdateConsultation: {
    path: "/api/v1/consultation/{id}/",
    method: "PATCH",
  },
  deleteConsultation: {
    path: "/api/v1/consultation/{id}/",
    method: "DELETE",
  },
  createDailyRounds: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/",
    method: "POST",
  },
  updateDailyReport: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/{id}/",
    method: "PUT",
  },
  updateDailyRound: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/{id}/",
    method: "PATCH",
  },
  getDailyReports: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/",
  },

  getDailyReport: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/{id}/",
  },
  dailyRoundsAnalyse: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/analyse/",
    method: "POST",
  },

  // Hospital Beds
  createCapacity: {
    path: "/api/v1/facility/{facilityId}/capacity/",
    method: "POST",
  },

  createDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor/",
    method: "POST",
  },

  getCapacity: {
    path: "/api/v1/facility/{facilityId}/capacity/",
  },

  getCapacityBed: {
    path: "/api/v1/facility/{facilityId}/capacity/{bed_id}/",
  },

  deleteCapacityBed: {
    path: "/api/v1/facility/{facilityId}/capacity/{bed_id}/",
    method: "DELETE",
  },

  listDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor/",
  },
  getDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor/{id}/",
  },

  updateCapacity: {
    path: "/api/v1/facility/{facilityId}/capacity",
    method: "PUT",
  },

  updateDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor",
    method: "PUT",
  },

  deleteDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor",
    method: "DELETE",
  },

  //Triage
  createTriage: {
    path: "/api/v1/facility/{facilityId}/patient_stats/",
    method: "POST",
  },
  getTriage: {
    path: "/api/v1/facility/{facilityId}/patient_stats/",
  },

  getTriageDetails: {
    path: "/api/v1/facility/{facilityId}/patient_stats/{id}/",
  },

  // //Care Center
  // createCenter: {
  //     path: "/api/v1/carecenter/",
  //     method: 'POST'
  // }

  // Patient

  searchPatient: {
    path: "/api/v1/patient/search",
  },
  patientList: {
    path: "/api/v1/patient/",
  },
  addPatient: {
    path: "/api/v1/patient/",
    method: "POST",
  },
  getPatient: {
    path: "/api/v1/patient/{id}/",
  },
  updatePatient: {
    path: "/api/v1/patient/{id}/",
    method: "PUT",
  },
  patchPatient: {
    path: "/api/v1/patient/{id}/",
    method: "PATCH",
  },
  transferPatient: {
    path: "/api/v1/patient/{id}/transfer/",
    method: "POST",
  },
  getPatientNotes: {
    path: "/api/v1/patient/{patientId}/notes/",
    method: "GET",
  },
  addPatientNote: {
    path: "/api/v1/patient/{patientId}/notes/",
    method: "POST",
  },
  sampleTestList: {
    path: "/api/v1/patient/{patientId}/test_sample/",
  },
  createSampleTest: {
    path: "/api/v1/patient/{patientId}/test_sample/",
    method: "POST",
  },
  sampleReport: {
    path: "/api/v1/patient/{id}/test_sample/{sampleId}/icmr_sample",
  },

  // External Results
  externalResultList: {
    path: "/api/v1/external_result/",
  },
  externalResult: {
    path: "/api/v1/external_result/{id}/",
  },
  externalResultUploadCsv: {
    path: "/api/v1/external_result/bulk_upsert/",
    method: "POST",
  },

  deleteExternalResult: {
    path: "/api/v1/external_result",
    method: "DELETE",
  },

  updateExternalResult: {
    path: "/api/v1/external_result/{id}/",
    method: "PUT",
  },

  partialUpdateExternalResult: {
    path: "/api/v1/external_result/{id}/",
    method: "PATCH",
  },

  // States
  statesList: {
    path: "/api/v1/state/",
  },

  getState: {
    path: "/api/v1/state/{id}/",
  },

  // Districts

  getDistrict: {
    path: "/api/v1/district/{id}/",
  },
  getDistrictByState: {
    path: "/api/v1/state/{id}/districts/",
  },
  getDistrictByName: {
    path: "/api/v1/district/",
  },
  getAllLocalBodyByDistrict: {
    path: "/api/v1/district/{id}/get_all_local_body/",
  },
  getLocalbodyByDistrict: {
    path: "/api/v1/district/{id}/local_bodies/",
  },

  // Local Body
  getLocalBody: {
    path: "/api/v1/local_body/{id}/",
  },
  getAllLocalBody: {
    path: "/api/v1/local_body/",
  },
  getLocalbodyByName: {
    path: "/api/v1/local_body/",
  },

  // ward
  getWard: {
    path: "/api/v1/ward/{id}/",
  },
  getWards: {
    path: "/api/v1/ward/",
  },
  getWardByLocalBody: {
    path: "/api/v1/ward/?local_body={id}",
  },

  // Sample Test
  getTestSampleList: {
    path: "/api/v1/test_sample/",
  },
  getTestSample: {
    path: "/api/v1/test_sample",
  },
  patchSample: {
    path: "/api/v1/test_sample/{id}/",
    method: "PATCH",
  },

  //inventory
  getItems: {
    path: "/api/v1/items/",
  },
  createInventory: {
    path: "/api/v1/facility/{facilityId}/inventory/",
    method: "POST",
  },
  getInventoryLog: {
    path: "/api/v1/facility",
  },
  setMinQuantity: {
    path: "/api/v1/facility/{facilityId}/min_quantity/",
    method: "POST",
  },
  getMinQuantity: {
    path: "/api/v1/facility",
    method: "GET",
  },
  updateMinQuantity: {
    path: "/api/v1/facility/{facilityId}/min_quantity/{inventoryId}",
    method: "PATCH",
  },
  getInventorySummary: {
    path: "/api/v1/facility",
    method: "GET",
  },
  getItemName: {
    path: "/api/v1/items",
    method: "GET",
  },
  flagInventoryItem: {
    path: "/api/v1/facility/{facility_external_id}/inventory/{external_id}/flag/",
    method: "PUT",
  },
  deleteLastInventoryLog: {
    path: "/api/v1/facility/{facility_external_id}/inventory/delete_last/?item={id}",
    method: "DELETE",
  },
  discharge: {
    path: "/api/v1/patient/{external_id}/discharge_summary/",
    method: "POST",
  },
  dischargePatient: {
    path: "/api/v1/patient/{id}/discharge_patient/",
    method: "POST",
  },
  //Profile

  checkUsername: {
    path: "/api/v1/users/{username}/check_availability/",
    method: "GET",
  },

  getUserDetails: {
    path: "/api/v1/users/{username}/",
    method: "GET",
  },
  updateUserDetails: {
    path: "/api/v1/users",
    method: "PUT",
  },

  //Shift
  createShift: {
    path: "/api/v1/shift/",
    method: "POST",
  },
  updateShift: {
    path: "/api/v1/shift",
    method: "PUT",
  },
  deleteShiftRecord: {
    path: "/api/v1/shift",
    method: "DELETE",
  },
  listShiftRequests: {
    path: "/api/v1/shift/",
    method: "GET",
  },
  getShiftDetails: {
    path: "/api/v1/shift/{id}/",
  },
  completeTransfer: {
    path: "/api/v1/shift/{externalId}/transfer/",
    method: "POST",
  },
  downloadShiftRequests: {
    path: "/api/v1/shift/",
    method: "GET",
  },
  getShiftComments: {
    path: "/api/v1/shift/{id}/comment/",
    method: "GET",
  },
  addShiftComments: {
    path: "/api/v1/shift/{id}/comment/",
    method: "POST",
  },
  // Notifications
  getNotifications: {
    path: "/api/v1/notification/",
  },
  getNotificationData: {
    path: "/api/v1/notification/{id}/",
  },
  markNotificationAsRead: {
    path: "/api/v1/notification/{id}/",
    method: "PATCH",
  },
  getPublicKey: {
    path: "/api/v1/notification/public_key/",
  },
  sendNotificationMessages: {
    path: "/api/v1/notification/notify/",
    method: "POST",
  },

  // FileUpload Create
  createUpload: {
    path: "/api/v1/files/",
    method: "POST",
  },
  viewUpload: {
    path: "/api/v1/files/",
    method: "GET",
  },
  retrieveUpload: {
    path: "/api/v1/files/{fileId}/",
    method: "GET",
  },
  editUpload: {
    path: "/api/v1/files/{fileId}/?file_type={fileType}&associating_id={associatingId}",
    method: "PATCH",
  },

  // Investigation
  listInvestigations: {
    path: "/api/v1/investigation/",
    method: "GET",
  },
  listInvestigationGroups: {
    path: "/api/v1/investigation/group",
    method: "GET",
  },
  createInvestigation: {
    path: "/api/v1/consultation/{consultation_external_id}/investigation/",
    method: "POST",
  },
  getInvestigationSessions: {
    path: "/api/v1/consultation/{consultation_external_id}/investigation/get_sessions/",
    method: "GET",
  },
  getInvestigation: {
    path: "/api/v1/consultation/{consultation_external_id}/investigation/",
    method: "GET",
  },
  getPatientInvestigation: {
    path: "/api/v1/patient/{patient_external_id}/investigation/",
    method: "GET",
  },
  editInvestigation: {
    path: "/api/v1/consultation/{consultation_external_id}/investigation/batchUpdate/",
    method: "PUT",
  },

  // ICD11
  listICD11Diagnosis: {
    path: "/api/v1/icd/",
  },

  // Resource
  createResource: {
    path: "/api/v1/resource/",
    method: "POST",
  },
  updateResource: {
    path: "/api/v1/resource",
    method: "PUT",
  },
  deleteResourceRecord: {
    path: "/api/v1/resource",
    method: "DELETE",
  },
  listResourceRequests: {
    path: "/api/v1/resource/",
    method: "GET",
  },
  getResourceDetails: {
    path: "/api/v1/resource/{id}/",
  },
  downloadResourceRequests: {
    path: "/api/v1/resource/",
    method: "GET",
  },
  getResourceComments: {
    path: "/api/v1/resource/{id}/comment/",
    method: "GET",
  },
  addResourceComments: {
    path: "/api/v1/resource/{id}/comment/",
    method: "POST",
  },

  // Assets endpoints

  listAssets: {
    path: "/api/v1/asset",
    method: "GET",
  },
  createAsset: {
    path: "/api/v1/asset/",
    method: "POST",
  },
  getAssetUserLocation: {
    path: "​/api/v1/asset​/get_default_user_location​/",
    method: "GET",
  },
  createAssetUserLocation: {
    path: "/api/v1/asset/set_default_user_location/",
    method: "POST",
  },
  getAsset: {
    path: "/api/v1/asset/{external_id}/",
    method: "GET",
  },
  updateAsset: {
    path: "/api/v1/asset/{external_id}/",
    method: "PUT",
  },
  partialUpdateAsset: {
    path: "/api/v1/asset/{external_id}/",
    method: "PATCH",
  },

  // Asset transaction endpoints

  listAssetTransaction: {
    path: "/api/v1/asset_transaction/",
    method: "GET",
  },
  getAssetTransaction: {
    path: "/api/v1/asset_transaction/{id}",
    method: "GET",
  },
};

export default routes;
