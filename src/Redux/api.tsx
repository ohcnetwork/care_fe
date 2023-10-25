import { IConfig } from "../Common/hooks/useConfig";
import {
  IAadhaarOtp,
  IAadhaarOtpTBody,
  ICheckAndGenerateMobileOtp,
  IConfirmMobileOtp,
  ICreateHealthIdRequest,
  ICreateHealthIdResponse,
  IGenerateMobileOtpTBody,
  IHealthFacility,
  IHealthId,
  ILinkABHANumber,
  ISearchByHealthIdTBody,
  IVerifyAadhaarOtpTBody,
  IcreateHealthFacilityTBody,
  IgetAbhaCardTBody,
  IinitiateAbdmAuthenticationTBody,
  IpartialUpdateHealthFacilityTBody,
} from "../Components/ABDM/models";
import {
  AssetBedBody,
  AssetBedModel,
  AssetData,
  AssetLocationObject,
  AssetService,
  AssetServiceUpdate,
  AssetTransaction,
  AssetUpdate,
} from "../Components/Assets/AssetTypes";
import {
  FacilityModel,
  LocationModel,
  WardModel,
} from "../Components/Facility/models";
import {
  IDeleteExternalResult,
  IExternalResult,
  IExternalResultCsv,
  ILocalBodies,
  ILocalBodyByDistrict,
  IPartialUpdateExternalResult,
} from "../Components/ExternalResult/models";
import { Prescription } from "../Components/Medicine/models";
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

interface LoginInput {
  username: string;
  password: string;
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
    TRes: Type<JwtTokenObtainPair>(),
    TBody: Type<LoginInput>(),
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
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{ token: string }>(),
  },

  resetPassword: {
    path: "/api/v1/password_reset/confirm/",
    method: "POST",
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{ password: string; confirm: string }>(),
  },

  forgotPassword: {
    path: "/api/v1/password_reset/",
    method: "POST",
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{ username: string }>(),
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
  },

  addUserFacility: {
    path: "/api/v1/users/{username}/add_facility/",
    method: "PUT",
  },

  addUserSkill: {
    path: "/api/v1/users/{username}/skill/",
    method: "POST",
  },

  deleteUserFacility: {
    path: "/api/v1/users/{username}/delete_facility/",
    method: "DELETE",
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

  // Skill Endpoints

  getAllSkills: {
    path: "/api/v1/skill/",
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
    method: "GET",
    TRes: Type<FacilityModel>(),
  },

  getAnyFacility: {
    path: "/api/v1/getallfacilities/{id}/",
    method: "GET",
    TRes: Type<FacilityModel>(),
  },

  updateFacility: {
    path: "/api/v1/facility",
    method: "PUT",
  },

  partialUpdateFacility: {
    path: "/api/v1/facility/{id}/",
    method: "PATCH",
    TRes: Type<FacilityModel>(),
    TBody: Type<Partial<FacilityModel>>(),
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
    TRes: Type<PaginatedResponse<LocationModel>>(),
  },
  createFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/",
    method: "POST",
  },
  getFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/",
    method: "GET",
    TRes: Type<AssetLocationObject>(),
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
    TRes: Type<PaginatedResponse<AssetBedModel>>(),
  },
  createAssetBed: {
    path: "/api/v1/assetbed/",
    method: "POST",
    TRes: Type<AssetData>(),
    TBody: Type<AssetBedBody>(),
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
    TRes: Type<AssetBedModel>(),
    TBody: Type<AssetBedBody>(),
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
    method: "GET",
    TRes: Type<PaginatedResponse<IExternalResult>>(),
  },
  externalResult: {
    path: "/api/v1/external_result/{id}/",
    method: "GET",
    TRes: Type<IExternalResult>(),
  },
  externalResultUploadCsv: {
    path: "/api/v1/external_result/bulk_upsert/",
    method: "POST",
    TBody: Type<IExternalResultCsv>(),
    TRes: Type<IExternalResult[]>(),
  },

  deleteExternalResult: {
    path: "/api/v1/external_result/{id}/",
    method: "DELETE",
    TRes: Type<IDeleteExternalResult>(),
  },

  updateExternalResult: {
    path: "/api/v1/external_result/{id}/",
    method: "PUT",
  },

  partialUpdateExternalResult: {
    path: "/api/v1/external_result/{id}/",
    method: "PATCH",
    TRes: Type<IPartialUpdateExternalResult>(),
    TBody: Type<IPartialUpdateExternalResult>(),
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
    method: "GET",
    TRes: Type<ILocalBodyByDistrict[]>(),
  },
  getLocalbodyByDistrict: {
    path: "/api/v1/district/{id}/local_bodies/",
    method: "GET",
    TRes: Type<ILocalBodies[]>(),
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
    method: "GET",
    TRes: Type<PaginatedResponse<WardModel>>(),
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
    TRes: Type<PaginatedResponse<AssetData>>(),
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
    TRes: Type<AssetData>(),
  },
  updateAsset: {
    path: "/api/v1/asset/{external_id}/",
    method: "PUT",
  },
  partialUpdateAsset: {
    path: "/api/v1/asset/{external_id}/",
    method: "PATCH",
    TRes: Type<AssetData>(),
    TBody: Type<AssetUpdate>(),
  },

  // Asset transaction endpoints

  listAssetTransaction: {
    path: "/api/v1/asset_transaction/",
    method: "GET",
    TRes: Type<PaginatedResponse<AssetTransaction>>(),
  },
  getAssetTransaction: {
    path: "/api/v1/asset_transaction/{id}",
    method: "GET",
  },

  // Asset service endpoints

  listAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/",
    method: "GET",
    TRes: Type<PaginatedResponse<AssetService>>(),
  },
  getAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/{external_id}",
    method: "GET",
  },
  updateAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/{external_id}",
    method: "PUT",
    TRes: Type<AssetService>(),
    TBody: Type<AssetServiceUpdate>(),
  },

  abha: {
    // ABDM HealthID endpoints
    generateAadhaarOtp: {
      path: "/api/v1/abdm/healthid/generate_aadhaar_otp/",
      method: "POST",
      TRes: Type<IAadhaarOtp>(),
      TBody: Type<IAadhaarOtpTBody>(),
    },

    resendAadhaarOtp: {
      path: "/api/v1/abdm/healthid/resend_aadhaar_otp/",
      method: "POST",
      TRes: Type<IAadhaarOtp>(),
      TBody: Type<IAadhaarOtp>(),
    },

    verifyAadhaarOtp: {
      path: "/api/v1/abdm/healthid/verify_aadhaar_otp/",
      method: "POST",
      TRes: Type<IAadhaarOtp>(),
      TBody: Type<IVerifyAadhaarOtpTBody>(),
    },

    generateMobileOtp: {
      path: "/api/v1/abdm/healthid/generate_mobile_otp/",
      method: "POST",
      TRes: Type<unknown>(),
      TBody: Type<unknown>(),
    },

    checkAndGenerateMobileOtp: {
      path: "/api/v1/abdm/healthid/check_and_generate_mobile_otp/",
      method: "POST",
      TRes: Type<ICheckAndGenerateMobileOtp>(),
      TBody: Type<IGenerateMobileOtpTBody>(),
    },

    // TODO: resend mobile otp
    verifyMobileOtp: {
      path: "/api/v1/abdm/healthid/verify_mobile_otp/",
      method: "POST",
      TRes: Type<IAadhaarOtp>(),
      TBody: Type<IVerifyAadhaarOtpTBody>(),
    },

    createHealthId: {
      path: "/api/v1/abdm/healthid/create_health_id/",
      method: "POST",
      TRes: Type<ICreateHealthIdResponse>(),
      TBody: Type<ICreateHealthIdRequest>(),
    },

    searchByHealthId: {
      path: "/api/v1/abdm/healthid/search_by_health_id/",
      method: "POST",
      TRes: Type<IHealthId>(),
      TBody: Type<ISearchByHealthIdTBody>(),
    },

    initiateAbdmAuthentication: {
      path: "/api/v1/abdm/healthid/auth_init/",
      method: "POST",
      TRes: Type<IConfirmMobileOtp>(),
      TBody: Type<IinitiateAbdmAuthenticationTBody>(),
    },

    confirmWithAadhaarOtp: {
      path: "/api/v1/abdm/healthid/confirm_with_aadhaar_otp/",
      method: "POST",
      TRes: Type<IConfirmMobileOtp>(),
      TBody: Type<IConfirmMobileOtp>(),
    },

    confirmWithMobileOtp: {
      path: "/api/v1/abdm/healthid/confirm_with_mobile_otp/",
      method: "POST",
      TRes: Type<IConfirmMobileOtp>(),
      TBody: Type<IConfirmMobileOtp>(),
    },

    linkViaQR: {
      path: "/api/v1/abdm/healthid/link_via_qr/",
      method: "POST",
      TRes: Type<ILinkABHANumber>(),
      TBody: Type<ISearchByHealthIdTBody>(),
    },

    linkCareContext: {
      path: "/api/v1/abdm/healthid/add_care_context/",
      method: "POST",
      TRes: Type<unknown>(),
      TBody: Type<unknown>(),
    },

    getAbhaCard: {
      path: "/api/v1/abdm/healthid/get_abha_card/",
      method: "POST",
      TRes: Type<unknown>(),
      TBody: Type<IgetAbhaCardTBody>(),
    },

    // ABDM Health Facility

    listHealthFacility: {
      path: "/api/v1/abdm/health_facility/",
      method: "GET",
    },

    createHealthFacility: {
      path: "/api/v1/abdm/health_facility/",
      method: "POST",
      TRes: Type<IHealthFacility>(),
      TBody: Type<IcreateHealthFacilityTBody>(),
    },

    getHealthFacility: {
      path: "/api/v1/abdm/health_facility/{facility_id}/",
      method: "GET",
      TRes: Type<IHealthFacility>(),
    },

    updateHealthFacility: {
      path: "/api/v1/abdm/health_facility/{facility_id}/",
      method: "PUT",
      TRes: Type<IHealthFacility>(),
      TBody: Type<IcreateHealthFacilityTBody>(),
    },

    partialUpdateHealthFacility: {
      path: "/api/v1/abdm/health_facility/{facility_id}/",
      method: "PATCH",
      TRes: Type<IHealthFacility>(),
      TBody: Type<IpartialUpdateHealthFacilityTBody>(),
    },

    registerHealthFacilityAsService: {
      path: "/api/v1/abdm/health_facility/{facility_id}/register_service/",
      method: "POST",
      TRes: Type<IHealthFacility>(),
      TBody: Type<IcreateHealthFacilityTBody>(),
    },
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
    TBody: Type<Prescription>(),
    TRes: Type<Prescription>(),
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
    TBody: Type<{ discontinued_reason: string }>(),
    TRes: Type<Record<string, never>>(),
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
