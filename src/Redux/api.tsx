import { IConfig } from "../Common/hooks/useConfig";
import { AssetData } from "../Components/Assets/AssetTypes";
import {
  IUserFacilityRequest,
  IFacilityNotificationRequest,
  IFacilityRequest,
  IFacilityResponse,
  IListDoctorResponse,
  IUserListFacilityResponse,
  LocationModel,
  IUserFacilityResponse,
  IAllFacilitiesResponse,
  IFacilityUserResponse,
  ILocalBodyResponse,
  IInventorySummaryResponse,
  IInventoryLogResponse,
  IFaciclityMinimumQuantityResponse,
  IFaciclityMinimumQuantityRequest,
  IPatientTransferRequest,
  IPatientTransferResponse,
  IInvestigationResponse,
  IConsultationBedResponse,
  ITriageDetailResponse,
  IMinQuantityItemResponse,
  ISetMinQuantityRequest,
  ISetMinQuantityResponse,
  IFlagInventoryItemResponse,
  IAssetBedResponse,
  IStateListResponse,
  IDistrictLocalBodyResponse,
  IWardLocalBodyResponse,
  ICreateTriageRequest,
  ICreateTriageResponse,
  IFacilityNotificationResponse,
  CapacityModal,
  StateModel,
  InventoryItemObjectModel,
  DeleteModel,
} from "../Components/Facility/models";
import { PatientModel } from "../Components/Patient/models";
import { UserModel } from "../Components/Users/models";
import { PaginatedResponse } from "../Utils/request/types";

/**
 * A fake function that returns an empty object casted to type T
 * @returns Empty object as type T
 */
function Type<T>(): T {
  return {} as T;
}

interface JwtTokenObtainPair {
  access: string;
  refresh: string;
}

const routes = {
  config: {
    path: import.meta.env.REACT_APP_CONFIG ?? "/config.json",
    method: "GET",
    noAuth: true,
    TRes: Type<IConfig>(),
  },

  // Auth Endpoints
  login: {
    path: "/api/v1/auth/login/",
    method: "POST",
    noAuth: true,
  },

  token_refresh: {
    path: "/api/v1/auth/token/refresh/",
    method: "POST",
    TRes: Type<JwtTokenObtainPair>(),
    TBody: Type<{ refresh: string }>(),
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
    TRes: Type<UserModel>(),
  },

  userList: {
    path: "/api/v1/users/",
  },

  userListSkill: {
    path: "/api/v1/users/{username}/skill/",
  },

  userListFacility: {
    path: "/api/v1/users/{username}/get_facilities/",
    TRes: Type<IUserListFacilityResponse>(),
  },

  addUserFacility: {
    path: "/api/v1/users/{username}/add_facility/",
    method: "PUT",
    TBody: Type<IUserFacilityRequest>(),
    TRes: Type<IUserFacilityResponse>(),
  },

  addUserSkill: {
    path: "/api/v1/users/{username}/skill/",
    method: "POST",
  },

  deleteUserFacility: {
    path: "/api/v1/users/{username}/delete_facility/",
    method: "DELETE",
    TRes: Type<DeleteModel>(),
  },

  clearHomeFacility: {
    path: "/api/v1/users/{username}/clear_home_facility/",
    method: "DELETE",
  },

  deleteUserSkill: {
    path: "/api/v1/users/{username}/skill/{id}/",
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
    path: "/api/v1/users/{username}",
    method: "DELETE",
    TRes: Type<DeleteModel>(),
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

  // Skill Endpoints

  getAllSkills: {
    path: "/api/v1/skill/",
  },

  // Facility Endpoints

  getPermittedFacilities: {
    path: "/api/v1/facility/",
    TRes: Type<PaginatedResponse<IFacilityResponse>>(),
  },

  getAllFacilities: {
    path: "/api/v1/getallfacilities",
  },

  createFacility: {
    path: "/api/v1/facility/",
    method: "POST",
    TRes: Type<IFacilityResponse>(),
    TBody: Type<IFacilityRequest>(),
  },

  getPermittedFacility: {
    path: "/api/v1/facility/{id}/",
    TRes: Type<IFacilityResponse>(),
  },

  getAnyFacility: {
    path: "/api/v1/getallfacilities/{id}/",
    TRes: Type<IAllFacilitiesResponse>(),
  },

  updateFacility: {
    path: "/api/v1/facility/{id}/",
    method: "PUT",
    TRes: Type<IFacilityResponse>(),
    TBody: Type<IFacilityRequest>(),
  },

  partialUpdateFacility: {
    path: "/api/v1/facility/{id}/",
    method: "PATCH",
    TBody: Type<IFacilityRequest>(),
    TRes: Type<IFacilityResponse>(),
  },

  deleteFacilityCoverImage: {
    path: "/api/v1/facility/{id}/cover_image/",
    method: "DELETE",
  },

  getFacilityUsers: {
    path: "/api/v1/facility/{facility_id}/get_users/",
    TRes: Type<IFacilityUserResponse>(),
  },

  listFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/",
    method: "GET",
    TRes: Type<PaginatedResponse<LocationModel>>(),
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
    TRes: Type<IAssetBedResponse>(),
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

  // Patient Asset Beds (for CNS and Monitoring Hub)
  listPatientAssetBeds: {
    path: "/api/v1/facility/{facility_external_id}/patient_asset_beds/",
    method: "GET",
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
    path: "/api/v1/facility/{id}",
    method: "DELETE",
    TRes: Type<DeleteModel>(),
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
    TRes: Type<IConsultationBedResponse>(),
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
    TRes: Type<PaginatedResponse<CapacityModal>>(),
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
    TRes: Type<IListDoctorResponse>(),
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
    TBody: Type<ICreateTriageRequest>(),
    TRes: Type<ICreateTriageResponse>(),
  },
  getTriage: {
    path: "/api/v1/facility/{facilityId}/patient_stats/",
    TRes: Type<PaginatedResponse<ITriageDetailResponse>>(),
  },

  getTriageDetails: {
    path: "/api/v1/facility/{facilityId}/patient_stats/{id}/",
    TRes: Type<ITriageDetailResponse>(),
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
    TRes: Type<PatientModel>(),
  },
  addPatient: {
    path: "/api/v1/patient/",
    method: "POST",
  },
  getPatient: {
    path: "/api/v1/patient/{id}/",
    TRes: Type<PatientModel>(),
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
    TBody: Type<IPatientTransferRequest>(),
    TRes: Type<IPatientTransferResponse>(),
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
    TRes: Type<IStateListResponse>(),
  },

  getState: {
    path: "/api/v1/state/{id}/",
    TRes: Type<StateModel>(),
  },

  // Districts

  getDistrict: {
    path: "/api/v1/district/{id}/",
    TRes: Type<StateModel>(),
  },
  getDistrictByState: {
    path: "/api/v1/state/{id}/districts/",
    TRes: Type<StateModel>(),
  },
  getDistrictByName: {
    path: "/api/v1/district/",
  },
  getAllLocalBodyByDistrict: {
    path: "/api/v1/district/{id}/get_all_local_body/",
  },
  getLocalbodyByDistrict: {
    path: "/api/v1/district/{id}/local_bodies/",
    TRes: Type<IDistrictLocalBodyResponse>(),
  },

  // Local Body
  getLocalBody: {
    path: "/api/v1/local_body/{id}/",
    TRes: Type<ILocalBodyResponse>(),
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
    TRes: Type<IWardLocalBodyResponse>(),
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
    TRes: Type<PaginatedResponse<InventoryItemObjectModel>>(),
  },
  createInventory: {
    path: "/api/v1/facility/{facilityId}/inventory/",
    method: "POST",
  },
  getInventoryLog: {
    path: "/api/v1/facility/{id}/inventory/",
    TRes: Type<IInventoryLogResponse>(),
  },
  setMinQuantity: {
    path: "/api/v1/facility/{facilityId}/min_quantity/",
    method: "POST",
    TBody: Type<ISetMinQuantityRequest>(),
    TRes: Type<ISetMinQuantityResponse>(),
  },
  getMinQuantity: {
    path: "/api/v1/facility/{id}/min_quantity/",
    method: "GET",
    TRes: Type<PaginatedResponse<IMinQuantityItemResponse>>(),
  },

  getMinQuantityOfItem: {
    path: "/api/v1/facility/{id}/min_quantity/{external_id}",
    method: "GET",
    TRes: Type<IMinQuantityItemResponse>(),
  },
  updateMinQuantity: {
    path: "/api/v1/facility/{facilityId}/min_quantity/{inventoryId}",
    method: "PATCH",
    TBody: Type<IFaciclityMinimumQuantityRequest>(),
    TRes: Type<IFaciclityMinimumQuantityResponse>(),
  },
  getInventorySummary: {
    path: "/api/v1/facility/{id}/inventorysummary/",
    method: "GET",
    TRes: Type<IInventorySummaryResponse>(),
  },
  getItemName: {
    path: "/api/v1/items",
    method: "GET",
  },
  flagInventoryItem: {
    path: "/api/v1/facility/{facility_external_id}/inventory/{external_id}/flag/",
    method: "PUT",
    TRes: Type<IFlagInventoryItemResponse>(),
  },
  deleteLastInventoryLog: {
    path: "/api/v1/facility/{facility_external_id}/inventory/delete_last/?item={id}",
    method: "DELETE",
    TRes: Type<DeleteModel>(),
  },
  dischargeSummaryGenerate: {
    path: "/api/v1/consultation/{external_id}/generate_discharge_summary/",
    method: "POST",
  },
  dischargeSummaryPreview: {
    path: "/api/v1/consultation/{external_id}/preview_discharge_summary",
    method: "GET",
  },
  dischargeSummaryEmail: {
    path: "/api/v1/consultation/{external_id}/email_discharge_summary/",
    method: "POST",
  },
  dischargePatient: {
    path: "/api/v1/consultation/{id}/discharge_patient/",
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
    TRes: Type<IFacilityNotificationResponse>(),
    Tbody: Type<IFacilityNotificationRequest>(),
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
    TRes: Type<IInvestigationResponse>(),
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
  // Medibase
  listMedibaseMedicines: {
    path: "/api/v1/medibase/",
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
    TRes: Type<AssetData>(),
  },
  deleteAsset: {
    path: "/api/v1/asset/{external_id}/",
    method: "DELETE",
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

  // Asset service endpoints

  listAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/",
    method: "GET",
  },
  getAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/{external_id}",
    method: "GET",
  },
  updateAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/{external_id}",
    method: "PUT",
  },

  // ABDM HealthID endpoints
  generateAadhaarOtp: {
    path: "/api/v1/abdm/healthid/generate_aadhaar_otp/",
    method: "POST",
  },

  resendAadhaarOtp: {
    path: "/api/v1/abdm/healthid/resend_aadhaar_otp/",
    method: "POST",
  },

  verifyAadhaarOtp: {
    path: "/api/v1/abdm/healthid/verify_aadhaar_otp/",
    method: "POST",
  },

  generateMobileOtp: {
    path: "/api/v1/abdm/healthid/generate_mobile_otp/",
    method: "POST",
  },

  checkAndGenerateMobileOtp: {
    path: "/api/v1/abdm/healthid/check_and_generate_mobile_otp/",
    method: "POST",
  },

  // TODO: resend mobile otp
  verifyMobileOtp: {
    path: "/api/v1/abdm/healthid/verify_mobile_otp/",
    method: "POST",
  },

  createHealthId: {
    path: "/api/v1/abdm/healthid/create_health_id/",
    method: "POST",
  },

  searchByHealthId: {
    path: "/api/v1/abdm/healthid/search_by_health_id/",
    method: "POST",
  },

  initiateAbdmAuthentication: {
    path: "/api/v1/abdm/healthid/auth_init/",
    method: "POST",
  },

  confirmWithAadhaarOtp: {
    path: "/api/v1/abdm/healthid/confirm_with_aadhaar_otp/",
    method: "POST",
  },

  confirmWithMobileOtp: {
    path: "/api/v1/abdm/healthid/confirm_with_mobile_otp/",
    method: "POST",
  },

  linkViaQR: {
    path: "/api/v1/abdm/healthid/link_via_qr/",
    method: "POST",
  },

  linkCareContext: {
    path: "/api/v1/abdm/healthid/add_care_context/",
    method: "POST",
  },

  getAbhaCard: {
    path: "/api/v1/abdm/healthid/get_abha_card/",
    method: "POST",
  },

  // ABDM Health Facility

  listHealthFacility: {
    path: "/api/v1/abdm/health_facility/",
    method: "GET",
  },

  createHealthFacility: {
    path: "/api/v1/abdm/health_facility/",
    method: "POST",
  },

  getHealthFacility: {
    path: "/api/v1/abdm/health_facility/{facility_id}/",
    method: "GET",
  },

  updateHealthFacility: {
    path: "/api/v1/abdm/health_facility/{facility_id}/",
    method: "PUT",
  },

  partialUpdateHealthFacility: {
    path: "/api/v1/abdm/health_facility/{facility_id}/",
    method: "PATCH",
  },

  registerHealthFacilityAsService: {
    path: "/api/v1/abdm/health_facility/{facility_id}/register_service/",
    method: "POST",
  },

  // Asset Availability endpoints

  listAssetAvailability: {
    path: "/api/v1/asset_availability/",
    method: "GET",
  },
  getAssetAvailability: {
    path: "/api/v1/asset_availability/{id}",
    method: "GET",
  },

  // Prescription endpoints

  listPrescriptions: {
    path: "/api/v1/consultation/{consultation_external_id}/prescriptions/",
    method: "GET",
  },

  createPrescription: {
    path: "/api/v1/consultation/{consultation_external_id}/prescriptions/",
    method: "POST",
  },

  listAdministrations: {
    path: "/api/v1/consultation/{consultation_external_id}/prescription_administration/",
    method: "GET",
  },

  getAdministration: {
    path: "/api/v1/consultation/{consultation_external_id}/prescription_administration/{external_id}/",
    method: "GET",
  },

  getPrescription: {
    path: "/api/v1/consultation/{consultation_external_id}/prescriptions/{external_id}/",
    method: "GET",
  },

  administerPrescription: {
    path: "/api/v1/consultation/{consultation_external_id}/prescriptions/{external_id}/administer/",
    method: "POST",
  },

  discontinuePrescription: {
    path: "/api/v1/consultation/{consultation_external_id}/prescriptions/{external_id}/discontinue/",
    method: "POST",
  },

  // HCX Endpoints

  listPMJYPackages: {
    path: "/api/v1/hcx/pmjy_packages/",
    method: "GET",
  },

  hcxListPayors: {
    path: "/api/v1/hcx/payors/",
    method: "GET",
  },

  hcxCheckEligibility: {
    path: "/api/v1/hcx/check_eligibility/",
    method: "POST",
  },

  listHCXPolicies: {
    path: "/api/v1/hcx/policy/",
    method: "GET",
  },

  createHCXPolicy: {
    path: "/api/v1/hcx/policy/",
    method: "POST",
  },

  getHCXPolicy: {
    path: "/api/v1/hcx/policy/{external_id}/",
    method: "GET",
  },

  updateHCXPolicy: {
    path: "/api/v1/hcx/policy/{external_id}/",
    method: "PUT",
  },

  partialUpdateHCXPolicy: {
    path: "/api/v1/hcx/policy/{external_id}/",
    method: "PATCH",
  },

  deleteHCXPolicy: {
    path: "/api/v1/hcx/policy/{external_id}/",
    method: "DELETE",
  },

  listHCXClaims: {
    path: "/api/v1/hcx/claim/",
    method: "GET",
  },

  createHCXClaim: {
    path: "/api/v1/hcx/claim/",
    method: "POST",
  },

  getHCXClaim: {
    path: "/api/v1/hcx/claim/{external_id}/",
    method: "GET",
  },

  updateHCXClaim: {
    path: "/api/v1/hcx/claim/{external_id}/",
    method: "PUT",
  },

  partialUpdateHCXClaim: {
    path: "/api/v1/hcx/claim/{external_id}/",
    method: "PATCH",
  },

  deleteHCXClaim: {
    path: "/api/v1/hcx/claim/{external_id}/",
    method: "DELETE",
  },

  hcxMakeClaim: {
    path: "/api/v1/hcx/make_claim/",
    method: "POST",
  },
} as const;

export default routes;
