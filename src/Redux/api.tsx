import {
  ConsentRequestModel,
  CreateConsentTBody,
} from "../Components/ABDM/types/consent";
import { HealthInformationModel } from "../Components/ABDM/types/health-information";
import {
  AssetBedBody,
  AssetBedModel,
  AssetData,
  AssetLocationObject,
  AssetService,
  AssetServiceUpdate,
  AssetTransaction,
  AvailabilityRecord,
  PatientAssetBed,
} from "../Components/Assets/AssetTypes";
import {
  BedModel,
  CapacityModal,
  ConsultationModel,
  CreateBedBody,
  CurrentBed,
  DailyRoundsBody,
  DailyRoundsRes,
  DistrictModel,
  DoctorModal,
  FacilityModel,
  FacilityRequest,
  FacilitySpokeModel,
  FacilitySpokeRequest,
  IFacilityNotificationRequest,
  IFacilityNotificationResponse,
  IUserFacilityRequest,
  InventoryItemsModel,
  InventoryLogResponse,
  InventorySummaryResponse,
  LocalBodyModel,
  LocationModel,
  MinimumQuantityItemResponse,
  PatientNotesEditModel,
  PatientNotesModel,
  PatientStatsModel,
  PatientTransferResponse,
  StateModel,
  WardModel,
} from "../Components/Facility/models";
import {
  DailyRoundsModel,
  PatientModel,
  SampleReportModel,
  SampleTestModel,
} from "../Components/Patient/models";
import { IComment, IResource } from "../Components/Resource/models";
import {
  IDeleteBedCapacity,
  ILocalBodies,
  ILocalBodyByDistrict,
} from "../Components/ExternalResult/models";
import {
  InvestigationGroup,
  InvestigationType,
} from "../Components/Facility/Investigations";
import {
  DupPatientModel,
  PatientConsentModel,
  PatientTransferRequest,
} from "../Components/Facility/models";
import { MedibaseMedicine, Prescription } from "../Components/Medicine/models";
import {
  NotificationData,
  PNconfigData,
} from "../Components/Notifications/models";
import {
  HCXClaimModel,
  HCXCommunicationModel,
  HCXPolicyModel,
} from "../Components/HCX/models";
import { ICD11DiagnosisModel } from "../Components/Diagnosis/types";
import { IShift } from "../Components/Shifting/models";
import { Investigation } from "../Components/Facility/Investigations/Reports/types";
import { PaginatedResponse } from "../Utils/request/types";
import {
  CreateFileRequest,
  CreateFileResponse,
  FileUploadModel,
} from "../Components/Patient/models";
import {
  SkillModel,
  SkillObjectModel,
  UpdatePasswordForm,
  UserAssignedModel,
  UserModel,
} from "../Components/Users/models";
import {
  EventGeneric,
  type Type,
} from "../Components/Facility/ConsultationDetails/Events/types";
import { InvestigationSessionType } from "../Components/Facility/Investigations/investigationsTab";
import { AbhaNumberModel } from "../Components/ABDM/types/abha";
import { ScribeModel } from "../Components/Scribe/Scribe";
import {
  IcreateHealthFacilityTBody,
  IHealthFacility,
  IpartialUpdateHealthFacilityTBody,
} from "../Components/ABDM/types/health-facility";
import { PMJAYPackageItem } from "@/Components/Common/PMJAYProcedurePackageAutocomplete";
import { InsurerOptionModel } from "@/Components/HCX/InsurerAutocomplete";

/**
 * A fake function that returns an empty object casted to type T
 * @returns Empty object as type T
 */
export function Type<T>(): T {
  return {} as T;
}

export interface JwtTokenObtainPair {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

const routes = {
  createScribe: {
    path: "/api/care_scribe/scribe/",
    method: "POST",
    TReq: Type<ScribeModel>(),
    TRes: Type<ScribeModel>(),
  },
  getScribe: {
    path: "/api/care_scribe/scribe/{external_id}/",
    method: "GET",
    TRes: Type<ScribeModel>(),
  },
  updateScribe: {
    path: "/api/care_scribe/scribe/{external_id}/",
    method: "PUT",
    TReq: Type<ScribeModel>(),
    TRes: Type<ScribeModel>(),
  },
  createScribeFileUpload: {
    path: "/api/care_scribe/scribe_file/",
    method: "POST",
    TBody: Type<CreateFileRequest>(),
    TRes: Type<CreateFileResponse>(),
  },
  editScribeFileUpload: {
    path: "/api/care_scribe/scribe_file/{id}/?file_type={fileType}&associating_id={associatingId}",
    method: "PATCH",
    TBody: Type<Partial<FileUploadModel>>(),
    TRes: Type<FileUploadModel>(),
  },

  // Auth Endpoints
  login: {
    path: "/api/v1/auth/login/",
    method: "POST",
    noAuth: true,
    TRes: Type<JwtTokenObtainPair>(),
    TBody: Type<LoginCredentials>(),
  },

  token_refresh: {
    path: "/api/v1/auth/token/refresh/",
    method: "POST",
    TRes: Type<JwtTokenObtainPair>(),
    TBody: Type<{ refresh: JwtTokenObtainPair["refresh"] }>(),
  },

  token_verify: {
    path: "/api/v1/auth/token/verify/",
    method: "POST",
  },

  checkResetToken: {
    path: "/api/v1/password_reset/check/",
    method: "POST",
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{
      token: string;
    }>(),
  },

  resetPassword: {
    path: "/api/v1/password_reset/confirm/",
    method: "POST",
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{
      password: string;
      confirm: string;
    }>(),
  },

  forgotPassword: {
    path: "/api/v1/password_reset/",
    method: "POST",
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{
      username: string;
    }>(),
  },

  updatePassword: {
    path: "/api/v1/password_change/",
    method: "PUT",
    TRes: Type<Record<string, string | string[]>>(),
    TBody: Type<UpdatePasswordForm>(),
  },
  // User Endpoints
  currentUser: {
    path: "/api/v1/users/getcurrentuser/",
    TRes: Type<UserModel>(),
  },

  userList: {
    path: "/api/v1/users/",
    method: "GET",
    TRes: Type<PaginatedResponse<UserModel>>(),
  },

  userListSkill: {
    path: "/api/v1/users/{username}/skill/",
    method: "GET",
    TRes: Type<PaginatedResponse<SkillModel>>(),
  },

  userListFacility: {
    path: "/api/v1/users/{username}/get_facilities/",
    method: "GET",
    TRes: Type<PaginatedResponse<FacilityModel>>(),
  },

  addUserFacility: {
    path: "/api/v1/users/{username}/add_facility/",
    method: "PUT",
    TBody: Type<IUserFacilityRequest>(),
    TRes: Type<UserModel>(),
  },

  addUserSkill: {
    path: "/api/v1/users/{username}/skill/",
    method: "POST",
    TBody: Type<{ skill: string }>(),
    TRes: Type<SkillModel>(),
  },

  deleteUserFacility: {
    path: "/api/v1/users/{username}/delete_facility/",
    method: "DELETE",
    TBody: Type<IUserFacilityRequest>(),
    TRes: Type<Record<string, never>>(),
  },

  clearHomeFacility: {
    path: "/api/v1/users/{username}/clear_home_facility/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },

  deleteUserSkill: {
    path: "/api/v1/users/{username}/skill/{id}/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },

  createUser: {
    path: "/api/v1/users/",
    method: "POST",
    noAuth: true,
  },

  updateUser: {
    path: "/api/v1/users/",
    method: "PUT",
  },

  partialUpdateUser: {
    path: "/api/v1/users/{username}/",
    method: "PATCH",
    TRes: Type<UserModel>(),
    TBody: Type<Partial<UserModel>>(),
  },

  deleteUser: {
    path: "/api/v1/users/{username}/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },

  addUser: {
    path: "/api/v1/users/add_user/",
    method: "POST",
    TRes: Type<UserModel>(),
  },

  searchUser: {
    path: "/api/v1/users/",
  },

  getOnlineDoctors: {
    path: "/api/v1/users/?user_type=Doctor&ordering=-last_login",
  },

  getUserPnconfig: {
    path: "/api/v1/users/{username}/pnconfig/",
    method: "GET",
    TRes: Type<PNconfigData>(),
  },

  updateUserPnconfig: {
    path: "/api/v1/users/{username}/pnconfig/",
    method: "PATCH",
    TRes: Type<PNconfigData>(),
  },

  // Skill Endpoints

  getAllSkills: {
    path: "/api/v1/skill/",
    method: "GET",
    TRes: Type<PaginatedResponse<SkillObjectModel>>(),
  },

  // Facility Endpoints

  getPermittedFacilities: {
    path: "/api/v1/facility/",
    TRes: Type<PaginatedResponse<FacilityModel>>(),
  },

  getAllFacilities: {
    path: "/api/v1/getallfacilities/",
    TRes: Type<PaginatedResponse<FacilityModel>>(),
  },

  createFacility: {
    path: "/api/v1/facility/",
    method: "POST",
    TRes: Type<FacilityModel>(),
    TBody: Type<FacilityRequest>(),
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
    path: "/api/v1/facility/{id}/",
    method: "PUT",
    TRes: Type<FacilityModel>(),
    TBody: Type<FacilityRequest>(),
  },

  partialUpdateFacility: {
    path: "/api/v1/facility/{id}/",
    method: "PATCH",
    TRes: Type<FacilityModel>(),
    TBody: Type<Partial<FacilityModel>>(),
  },

  getFacilityHubs: {
    path: "/api/v1/facility/{id}/hubs",
    method: "GET",
    TRes: Type<PaginatedResponse<FacilitySpokeModel>>(),
  },

  getFacilitySpokes: {
    path: "/api/v1/facility/{id}/spokes/",
    method: "GET",
    TRes: Type<PaginatedResponse<FacilitySpokeModel>>(),
  },

  updateFacilitySpokes: {
    path: "/api/v1/facility/{id}/spokes/{spoke_id}/",
    method: "PATCH",
    TRes: Type<FacilitySpokeModel>(),
    TBody: Type<FacilitySpokeRequest>(),
  },

  getFacilitySpoke: {
    path: "/api/v1/facility/{id}/spokes/{spoke_id}/",
    method: "GET",
    TRes: Type<FacilitySpokeModel>(),
  },

  createFacilitySpoke: {
    path: "/api/v1/facility/{id}/spokes/",
    method: "POST",
    TRes: Type<FacilitySpokeModel>(),
    TBody: Type<Partial<FacilitySpokeRequest>>(),
  },

  deleteFacilitySpoke: {
    path: "/api/v1/facility/{id}/spokes/{spoke_id}/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },

  deleteFacilityCoverImage: {
    path: "/api/v1/facility/{id}/cover_image/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },

  getFacilityUsers: {
    path: "/api/v1/facility/{facility_id}/get_users/",
    TRes: Type<PaginatedResponse<UserAssignedModel>>(),
  },

  listFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/",
    method: "GET",
    TRes: Type<PaginatedResponse<LocationModel>>(),
  },
  createFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/",
    method: "POST",
    TBody: Type<AssetLocationObject>(),
    TRes: Type<AssetLocationObject>(),
  },
  getFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/",
    method: "GET",
    TRes: Type<AssetLocationObject>(),
  },
  updateFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/",
    method: "PUT",
    TBody: Type<AssetLocationObject>(),
    TRes: Type<AssetLocationObject>(),
  },
  partialUpdateFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/",
    method: "PATCH",
  },
  deleteFacilityAssetLocation: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },
  listFacilityAssetLocationAvailability: {
    path: "/api/v1/facility/{facility_external_id}/asset_location/{external_id}/availability/",
    method: "GET",
    TRes: Type<PaginatedResponse<AvailabilityRecord>>(),
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
    TRes: Type<null | {
      detail?: string;
    }>(),
  },
  operateAsset: {
    path: "/api/v1/asset/{external_id}/operate_assets/",
    method: "POST",
  },

  // Patient Asset Beds (for CNS and Monitoring Hub)
  listPatientAssetBeds: {
    path: "/api/v1/facility/{facility_external_id}/patient_asset_beds/",
    method: "GET",
    TRes: Type<PaginatedResponse<PatientAssetBed>>(),
  },

  // Facility Beds
  listFacilityBeds: {
    path: "/api/v1/bed/",
    method: "GET",
    TRes: Type<PaginatedResponse<BedModel>>(),
  },
  createFacilityBed: {
    path: "/api/v1/bed/",
    method: "POST",
    TBody: Type<BedModel>(),
    TRes: Type<BedModel>(),
  },
  getFacilityBed: {
    path: "/api/v1/bed/{external_id}/",
    method: "GET",
    TRes: Type<BedModel>(),
  },
  updateFacilityBed: {
    path: "/api/v1/bed/{external_id}/",
    method: "PUT",
    TBody: Type<BedModel>(),
    TRes: Type<BedModel>(),
  },
  deleteFacilityBed: {
    path: "/api/v1/bed/{external_id}/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },

  // Consultation beds

  listConsultationBeds: {
    path: "/api/v1/consultationbed/",
    method: "GET",
    TRes: Type<PaginatedResponse<CurrentBed>>(),
  },
  createConsultationBed: {
    path: "/api/v1/consultationbed/",
    method: "POST",
    TBody: Type<CreateBedBody>(),
    TRes: Type<PaginatedResponse<CurrentBed>>(),
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
    path: "/api/v1/facility/{id}/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },

  downloadFacility: {
    path: "/api/v1/facility/?csv",
    method: "GET",
    TRes: Type<string>(),
  },
  downloadFacilityCapacity: {
    path: "/api/v1/facility/?csv&capacity",
    method: "GET",
    TRes: Type<string>(),
  },
  downloadFacilityDoctors: {
    path: "/api/v1/facility/?csv&doctors",
    method: "GET",
    TRes: Type<string>(),
  },

  downloadFacilityTriage: {
    path: "/api/v1/facility/?csv&triage",
    method: "GET",
    TRes: Type<string>(),
  },

  downloadPatients: {
    path: "/api/v1/patient/?csv",
    method: "GET",
    TRes: Type<string>(),
  },
  getConsultationList: {
    path: "/api/v1/consultation/",
    method: "GET",
    TRes: Type<PaginatedResponse<ConsultationModel>>(),
  },
  createConsultation: {
    path: "/api/v1/consultation/",
    method: "POST",
    TBody: Type<ConsultationModel>(),
    TRes: Type<ConsultationModel>(),
  },
  getConsultation: {
    path: "/api/v1/consultation/{id}/",
    method: "GET",
    TRes: Type<ConsultationModel>(),
  },
  updateConsultation: {
    path: "/api/v1/consultation/{id}/",
    method: "PUT",
    TBody: Type<ConsultationModel>(),
    TRes: Type<ConsultationModel>(),
  },
  partialUpdateConsultation: {
    path: "/api/v1/consultation/{id}/",
    method: "PATCH",
    TBody: Type<Partial<ConsultationModel>>(),
    TRes: Type<ConsultationModel>(),
  },
  deleteConsultation: {
    path: "/api/v1/consultation/{id}/",
    method: "DELETE",
  },
  createDailyRounds: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/",
    TBody: Type<DailyRoundsModel>(),
    TRes: Type<DailyRoundsModel>(),
    method: "POST",
  },
  updateDailyReport: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/{id}/",
    TBody: Type<DailyRoundsModel>(),
    TRes: Type<DailyRoundsModel>(),
    method: "PUT",
  },
  updateDailyRound: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/{id}/",
    method: "PATCH",
    TBody: Type<Partial<DailyRoundsModel>>(),
    TRes: Type<DailyRoundsModel>(),
  },
  getDailyReports: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/",
    method: "GET",
    TRes: Type<PaginatedResponse<DailyRoundsModel>>(),
  },

  getEvents: {
    path: "/api/v1/consultation/{consultationId}/events/",
    method: "GET",
    TRes: Type<PaginatedResponse<EventGeneric>>(),
  },

  getDailyReport: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/{id}/",
    method: "GET",
    TRes: Type<DailyRoundsModel>(),
  },
  dailyRoundsAnalyse: {
    path: "/api/v1/consultation/{consultationId}/daily_rounds/analyse/",
    method: "POST",
    TBody: Type<DailyRoundsBody>(),
    TRes: Type<DailyRoundsRes>(),
  },

  // Event Types

  listEventTypes: {
    path: "/api/v1/event_types/",
    method: "GET",
    TRes: Type<PaginatedResponse<Type>>(),
  },

  // Hospital Beds
  createCapacity: {
    path: "/api/v1/facility/{facilityId}/capacity/",
    method: "POST",
    TRes: Type<CapacityModal>(),
  },

  createDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor/",
    method: "POST",
    TRes: Type<DoctorModal>(),
    TBody: Type<DoctorModal>(),
  },

  getCapacity: {
    path: "/api/v1/facility/{facilityId}/capacity/",
    TRes: Type<PaginatedResponse<CapacityModal>>(),
  },

  getCapacityBed: {
    path: "/api/v1/facility/{facilityId}/capacity/{bed_id}/",
    TRes: Type<CapacityModal>(),
  },

  deleteCapacityBed: {
    path: "/api/v1/facility/{facilityId}/capacity/{bed_id}/",
    method: "DELETE",
    TRes: Type<IDeleteBedCapacity>(),
  },

  listDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor/",
    TRes: Type<PaginatedResponse<DoctorModal>>(),
  },
  getDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor/{id}/",
    TRes: Type<DoctorModal>(),
  },

  updateCapacity: {
    path: "/api/v1/facility/{facilityId}/capacity/{bed_id}/",
    method: "PUT",
    TRes: Type<CapacityModal>(),
  },

  updateDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor/{id}/",
    method: "PUT",
    TRes: Type<DoctorModal>(),
  },

  deleteDoctor: {
    path: "/api/v1/facility/{facilityId}/hospital_doctor/{area}/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },

  //Triage
  createTriage: {
    path: "/api/v1/facility/{facilityId}/patient_stats/",
    method: "POST",
    TBody: Type<PatientStatsModel>(),
    TRes: Type<PatientStatsModel>(),
  },
  getTriage: {
    path: "/api/v1/facility/{facilityId}/patient_stats/",
    TRes: Type<PaginatedResponse<PatientStatsModel>>(),
  },

  getTriageDetails: {
    path: "/api/v1/facility/{facilityId}/patient_stats/{id}/",
    TRes: Type<PatientStatsModel>(),
  },

  // //Care Center
  // createCenter: {
  //     path: "/api/v1/carecenter/",
  //     method: 'POST'
  // }

  // Patient

  searchPatient: {
    path: "/api/v1/patient/search/",
    TRes: Type<PaginatedResponse<DupPatientModel>>(),
  },
  patientList: {
    path: "/api/v1/patient/",
    method: "GET",
    TRes: Type<PaginatedResponse<PatientModel>>(),
  },
  addPatient: {
    path: "/api/v1/patient/",
    method: "POST",
    TRes: Type<PatientModel>(),
  },
  getPatient: {
    path: "/api/v1/patient/{id}/",
    method: "GET",
    TBody: Type<PatientModel>(),
    TRes: Type<PatientModel>(),
  },
  updatePatient: {
    path: "/api/v1/patient/{id}/",
    method: "PUT",
    TRes: Type<PatientModel>(),
  },
  patchPatient: {
    path: "/api/v1/patient/{id}/",
    method: "PATCH",
    TBody: Type<Partial<PatientModel>>(),
    TRes: Type<PatientModel>(),
  },
  transferPatient: {
    path: "/api/v1/patient/{id}/transfer/",
    method: "POST",
    TBody: Type<PatientTransferRequest>(),
    TRes: Type<PatientTransferResponse>(),
  },
  getPatientNotes: {
    path: "/api/v1/patient/{patientId}/notes/",
    method: "GET",
    TBody: Type<PatientNotesModel[]>(),
    TRes: Type<PaginatedResponse<PatientNotesModel>>(),
  },
  addPatientNote: {
    path: "/api/v1/patient/{patientId}/notes/",
    method: "POST",
    TRes: Type<PatientNotesModel>(),
    TBody: Type<
      Pick<PatientNotesModel, "note" | "thread"> & {
        consultation?: string;
        reply_to?: string;
      }
    >(),
  },
  updatePatientNote: {
    path: "/api/v1/patient/{patientId}/notes/{noteId}/",
    method: "PUT",
    TRes: Type<PatientNotesModel>(),
  },
  getPatientNoteEditHistory: {
    path: "/api/v1/patient/{patientId}/notes/{noteId}/edits/",
    method: "GET",
    TRes: Type<PaginatedResponse<PatientNotesEditModel>>(),
  },
  sampleTestList: {
    path: "/api/v1/patient/{patientId}/test_sample/",
    method: "GET",
    TRes: Type<PaginatedResponse<SampleTestModel>>(),
  },
  createSampleTest: {
    path: "/api/v1/patient/{patientId}/test_sample/",
    method: "POST",
    TRes: Type<PatientModel>(),
    TBody: Type<SampleTestModel>(),
  },
  sampleReport: {
    path: "/api/v1/patient/{id}/test_sample/{sampleId}/icmr_sample/",
    method: "GET",
    TRes: Type<SampleReportModel>(),
  },

  // States
  statesList: {
    path: "/api/v1/state/",
    method: "GET",
    TRes: Type<PaginatedResponse<StateModel>>(),
  },

  getState: {
    path: "/api/v1/state/{id}/",
    TRes: Type<StateModel>(),
  },

  // Districts

  getDistrict: {
    path: "/api/v1/district/{id}/",
    method: "GET",
    TRes: Type<DistrictModel>(),
  },
  getDistrictByState: {
    path: "/api/v1/state/{id}/districts/",
    method: "GET",
    TRes: Type<DistrictModel[]>(),
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
    TRes: Type<LocalBodyModel>(),
  },
  getAllLocalBody: {
    path: "/api/v1/local_body/",
    method: "GET",
    TRes: Type<PaginatedResponse<LocalBodyModel>>(),
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
    method: "GET",
    TRes: Type<PaginatedResponse<SampleTestModel>>(),
  },
  getTestSample: {
    path: "/api/v1/test_sample/{id}/",
    method: "GET",
    TRes: Type<SampleTestModel>(),
  },
  patchSample: {
    path: "/api/v1/test_sample/{id}/",
    method: "PATCH",
    TBody: Type<SampleTestModel>(),
    TRes: Type<PatientModel>(),
  },

  //inventory
  getItems: {
    path: "/api/v1/items/",
    method: "GET",
    TRes: Type<PaginatedResponse<InventoryItemsModel>>(),
  },
  createInventory: {
    path: "/api/v1/facility/{facilityId}/inventory/",
    method: "POST",
    TRes: Type<InventoryLogResponse>(),
  },
  getInventoryLog: {
    path: "/api/v1/facility/{facilityId}/inventory/",
    method: "GET",
    TRes: Type<PaginatedResponse<InventoryLogResponse>>(),
  },
  setMinQuantity: {
    path: "/api/v1/facility/{facilityId}/min_quantity/",
    method: "POST",
    TRes: Type<MinimumQuantityItemResponse>(),
  },
  getMinQuantity: {
    path: "/api/v1/facility/{facilityId}/min_quantity/",
    method: "GET",
    TRes: Type<PaginatedResponse<InventorySummaryResponse>>(),
  },
  getMinQuantityItem: {
    path: "/api/v1/facility/{facilityId}/min_quantity/{inventoryId}/",
    method: "GET",
    TRes: Type<MinimumQuantityItemResponse>(),
  },
  updateMinQuantity: {
    path: "/api/v1/facility/{facilityId}/min_quantity/{inventoryId}/",
    method: "PATCH",
    TRes: Type<PaginatedResponse<MinimumQuantityItemResponse>>(),
  },
  getInventorySummary: {
    path: "/api/v1/facility/{facility_external_id}/inventorysummary/",
    method: "GET",
    TRes: Type<PaginatedResponse<InventorySummaryResponse>>(),
  },
  getItemName: {
    path: "/api/v1/items/",
    method: "GET",
  },
  flagInventoryItem: {
    path: "/api/v1/facility/{facility_external_id}/inventory/{external_id}/flag/",
    method: "PUT",
    TRes: Type<PaginatedResponse<InventoryLogResponse>>(),
  },
  deleteLastInventoryLog: {
    path: "/api/v1/facility/{facility_external_id}/inventory/delete_last/?item={id}",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
  },
  dischargeSummaryGenerate: {
    path: "/api/v1/consultation/{external_id}/generate_discharge_summary/",
    method: "POST",
    TRes: Type<never>(),
  },
  dischargeSummaryPreview: {
    path: "/api/v1/consultation/{external_id}/preview_discharge_summary/",
    method: "GET",
    TRes: Type<{ read_signed_url: string }>(),
  },
  dischargeSummaryEmail: {
    path: "/api/v1/consultation/{external_id}/email_discharge_summary/",
    method: "POST",
    TRes: Type<never>(),
  },
  dischargePatient: {
    path: "/api/v1/consultation/{id}/discharge_patient/",
    method: "POST",
    TBody: Type<object>(),
    TRes: Type<object>(),
  },
  listFacilityDischargedPatients: {
    path: "/api/v1/facility/{facility_external_id}/discharged_patients/",
    method: "GET",
    TRes: Type<PaginatedResponse<PatientModel>>(),
  },

  // Consents
  listConsents: {
    path: "/api/v1/consultation/{consultationId}/consents/",
    method: "GET",
    TRes: Type<PaginatedResponse<PatientConsentModel>>(),
  },
  getConsent: {
    path: "/api/v1/consultation/{consultationId}/consents/{id}/",
    method: "GET",
    TRes: Type<PatientConsentModel>(),
  },
  createConsent: {
    path: "/api/v1/consultation/{consultationId}/consents/",
    method: "POST",
    TRes: Type<PatientConsentModel>(),
    TBody: Type<Partial<PatientConsentModel>>(),
  },
  partialUpdateConsent: {
    path: "/api/v1/consultation/{consultationId}/consents/{id}/",
    method: "PATCH",
    TRes: Type<PatientConsentModel>(),
    TBody: Type<Partial<PatientConsentModel>>(),
  },

  //Profile
  checkUsername: {
    path: "/api/v1/users/{username}/check_availability/",
    method: "GET",
    TRes: Type<Record<string, never>>(),
  },

  getUserDetails: {
    path: "/api/v1/users/{username}/",
    method: "GET",
    TRes: Type<UserModel>(),
  },
  updateUserDetails: {
    path: "/api/v1/users/",
    method: "PUT",
  },

  //Shift
  createShift: {
    path: "/api/v1/shift/",
    method: "POST",
    TBody: Type<Partial<IShift>>(),
    TRes: Type<PatientModel>(),
  },
  updateShift: {
    path: "/api/v1/shift/{id}/",
    method: "PUT",
    TBody: Type<IShift>(),
    TRes: Type<IShift>(),
  },
  deleteShiftRecord: {
    path: "/api/v1/shift/{id}/",
    method: "DELETE",
    TRes: Type<{ detail: string }>(),
  },
  listShiftRequests: {
    path: "/api/v1/shift/",
    method: "GET",
    TRes: Type<PaginatedResponse<IShift>>(),
  },
  getShiftDetails: {
    path: "/api/v1/shift/{id}/",
    method: "GET",
    TRes: Type<IShift>(),
  },
  completeTransfer: {
    path: "/api/v1/shift/{externalId}/transfer/",
    method: "POST",
    TBody: Type<IShift>(),
    TRes: Type<Partial<PatientModel>>(),
  },
  downloadShiftRequests: {
    path: "/api/v1/shift/",
    method: "GET",
    TRes: Type<string>(),
  },
  getShiftComments: {
    path: "/api/v1/shift/{id}/comment/",
    method: "GET",
    TRes: Type<PaginatedResponse<IComment>>(),
  },
  addShiftComments: {
    path: "/api/v1/shift/{id}/comment/",
    method: "POST",
    TBody: Type<Partial<IComment>>(),
    TRes: Type<IComment>(),
  },

  // Notifications
  getNotifications: {
    path: "/api/v1/notification/",
    method: "GET",
    TRes: Type<PaginatedResponse<NotificationData>>(),
  },
  getNotificationData: {
    path: "/api/v1/notification/{id}/",
    method: "GET",
    TRes: Type<NotificationData>(),
  },
  markNotificationAsRead: {
    path: "/api/v1/notification/{id}/",
    method: "PATCH",
    TRes: Type<NotificationData>(),
  },
  markNotificationAsUnRead: {
    path: "/api/v1/notification/{id}/",
    method: "PATCH",
    TRes: Type<NotificationData>(),
  },
  getPublicKey: {
    path: "/api/v1/notification/public_key/",
    method: "GET",
    TRes: Type<NotificationData>(),
  },
  sendNotificationMessages: {
    path: "/api/v1/notification/notify/",
    method: "POST",
    TRes: Type<IFacilityNotificationResponse>(),
    TBody: Type<IFacilityNotificationRequest>(),
  },

  // FileUpload Create
  createUpload: {
    path: "/api/v1/files/",
    method: "POST",
    TBody: Type<CreateFileRequest>(),
    TRes: Type<CreateFileResponse>(),
  },
  viewUpload: {
    path: "/api/v1/files/",
    method: "GET",
    TRes: Type<PaginatedResponse<FileUploadModel>>(),
  },
  retrieveUpload: {
    path: "/api/v1/files/{id}/",
    method: "GET",
    TRes: Type<FileUploadModel>(),
  },
  editUpload: {
    path: "/api/v1/files/{id}/?file_type={fileType}&associating_id={associatingId}",
    method: "PATCH",
    TBody: Type<Partial<FileUploadModel>>(),
    TRes: Type<FileUploadModel>(),
  },

  // Investigation
  listInvestigations: {
    path: "/api/v1/investigation/",
    method: "GET",
    TRes: Type<PaginatedResponse<InvestigationType>>(),
  },
  listInvestigationGroups: {
    path: "/api/v1/investigation/group/",
    method: "GET",
    TRes: Type<PaginatedResponse<InvestigationGroup>>(),
  },
  createInvestigation: {
    path: "/api/v1/consultation/{consultation_external_id}/investigation/",
    method: "POST",
    TRes: Type<Record<string, never>>(),
    TBody: Type<{
      investigations: {
        investigation: string;
        value: number;
        notes: string;
        session: string;
      }[];
    }>(),
  },
  getInvestigationSessions: {
    path: "/api/v1/consultation/{consultation_external_id}/investigation/get_sessions/",
    method: "GET",
    TRes: Type<InvestigationSessionType[]>(),
  },
  getInvestigation: {
    path: "/api/v1/consultation/{consultation_external_id}/investigation/",
    method: "GET",
    TRes: Type<PaginatedResponse<Investigation>>(),
  },
  getPatientInvestigation: {
    path: "/api/v1/patient/{patient_external_id}/investigation/",
    method: "GET",
    TRes: Type<PaginatedResponse<Investigation>>(),
  },
  editInvestigation: {
    path: "/api/v1/consultation/{consultation_external_id}/investigation/batchUpdate/",
    method: "PUT",
    TRes: Type<Record<string, never>>(),
    TBody: Type<{
      investigations: {
        external_id: string;
        value: number;
        notes: string;
      }[];
    }>(),
  },

  // ICD11
  listICD11Diagnosis: {
    path: "/api/v1/icd/",
    TRes: Type<ICD11DiagnosisModel[]>(),
  },
  getICD11Diagnosis: {
    path: "/api/v1/icd/{id}/",
    TRes: Type<ICD11DiagnosisModel>(),
    enableExperimentalCache: true,
  },
  // Medibase
  listMedibaseMedicines: {
    path: "/api/v1/medibase/",
    TRes: Type<MedibaseMedicine[]>(),
  },

  // Resource
  createResource: {
    path: "/api/v1/resource/",
    method: "POST",
    TRes: Type<IResource>(),
    TBody: Type<Partial<IResource>>(),
  },
  updateResource: {
    path: "/api/v1/resource/{id}/",
    method: "PUT",
    TRes: Type<IResource>(),
    TBody: Type<Partial<IResource>>(),
  },
  deleteResourceRecord: {
    path: "/api/v1/resource/{id}/",
    method: "DELETE",
    TRes: Type<{
      detail?: string;
    }>(),
  },
  listResourceRequests: {
    path: "/api/v1/resource/",
    method: "GET",
    TRes: Type<PaginatedResponse<IResource>>(),
  },
  getResourceDetails: {
    path: "/api/v1/resource/{id}/",
    method: "GET",
    TRes: Type<IResource>(),
  },
  downloadResourceRequests: {
    path: "/api/v1/resource/",
    method: "GET",
    TRes: Type<string>(),
  },
  getResourceComments: {
    path: "/api/v1/resource/{id}/comment/",
    method: "GET",
    TRes: Type<PaginatedResponse<IComment>>(),
  },
  addResourceComments: {
    path: "/api/v1/resource/{id}/comment/",
    method: "POST",
    TRes: Type<IComment>(),
    TBody: Type<Partial<IComment>>(),
  },

  // Assets endpoints

  listAssets: {
    path: "/api/v1/asset/",
    method: "GET",
    TRes: Type<PaginatedResponse<AssetData>>(),
  },
  createAsset: {
    path: "/api/v1/asset/",
    method: "POST",
    TBody: Type<AssetData>(),
    TRes: Type<AssetData>(),
  },
  getAssetUserLocation: {
    path: "/api/v1/asset/get_default_user_location/",
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
    TRes: Type<Record<string, never>>(),
  },
  updateAsset: {
    path: "/api/v1/asset/{external_id}/",
    method: "PUT",
    TBody: Type<AssetData>(),
    TRes: Type<AssetData>(),
  },
  partialUpdateAsset: {
    path: "/api/v1/asset/{external_id}/",
    method: "PATCH",
    TRes: Type<AssetData>(),
    TBody: Type<Partial<AssetData>>(),
  },
  listAssetAvailability: {
    path: "/api/v1/asset/{external_id}/availability/",
    method: "GET",
    TRes: Type<PaginatedResponse<AvailabilityRecord>>(),
  },
  listAssetQR: {
    path: "/api/v1/public/asset_qr/{qr_code_id}/",
    method: "GET",
    TRes: Type<AssetData>(),
  },

  // Asset transaction endpoints

  listAssetTransaction: {
    path: "/api/v1/asset_transaction/",
    method: "GET",
    TRes: Type<PaginatedResponse<AssetTransaction>>(),
  },
  getAssetTransaction: {
    path: "/api/v1/asset_transaction/{id}/",
    method: "GET",
  },

  // Asset service endpoints

  listAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/",
    method: "GET",
    TRes: Type<PaginatedResponse<AssetService>>(),
  },
  getAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/{external_id}/",
    method: "GET",
  },
  updateAssetService: {
    path: "/api/v1/asset/{asset_external_id}/service_records/{external_id}/",
    method: "PUT",
    TRes: Type<AssetService>(),
    TBody: Type<AssetServiceUpdate>(),
  },

  abdm: {
    consent: {
      list: {
        path: "/api/abdm/consent/",
        method: "GET",
        TRes: Type<PaginatedResponse<ConsentRequestModel>>(),
      },

      create: {
        path: "/api/abdm/consent/",
        method: "POST",
        TRes: Type<ConsentRequestModel>(),
        TBody: Type<CreateConsentTBody>(),
      },

      get: {
        path: "/api/abdm/consent/{id}/",
        method: "GET",
      },

      checkStatus: {
        path: "/api/abdm/v3/hiu/consent_request_status/",
        method: "POST",
        TBody: Type<{
          consent_request: string;
        }>(),
        TRes: Type<{
          detail: string;
        }>(),
      },
    },

    healthInformation: {
      get: {
        path: "/api/abdm/health_information/{artefactId}",
        method: "GET",
        TRes: Type<HealthInformationModel>(),
      },
    },

    healthFacility: {
      list: {
        path: "/api/abdm/health_facility/",
        method: "GET",
      },

      create: {
        path: "/api/abdm/health_facility/",
        method: "POST",
        TRes: Type<IHealthFacility>(),
        TBody: Type<IcreateHealthFacilityTBody>(),
      },

      get: {
        path: "/api/abdm/health_facility/{facility_id}/",
        method: "GET",
        TRes: Type<IHealthFacility>(),
      },

      update: {
        path: "/api/abdm/health_facility/{facility_id}/",
        method: "PUT",
        TRes: Type<IHealthFacility>(),
        TBody: Type<IcreateHealthFacilityTBody>(),
      },

      partialUpdate: {
        path: "/api/abdm/health_facility/{facility_id}/",
        method: "PATCH",
        TRes: Type<IHealthFacility>(),
        TBody: Type<IpartialUpdateHealthFacilityTBody>(),
      },

      registerAsService: {
        path: "/api/abdm/health_facility/{facility_id}/register_service/",
        method: "POST",
        TRes: Type<IHealthFacility>(),
        TBody: Type<IcreateHealthFacilityTBody>(),
      },
    },

    abhaNumber: {
      get: {
        path: "/api/abdm/abha_number/{abhaNumberId}/",
        method: "GET",
        TRes: Type<AbhaNumberModel>(),
      },
      create: {
        path: "/api/abdm/abha_number/",
        method: "POST",
        TBody: Type<Partial<AbhaNumberModel>>(),
        TRes: Type<AbhaNumberModel>(),
      },
    },

    healthId: {
      abhaCreateSendAadhaarOtp: {
        path: "/api/abdm/v3/health_id/create/send_aadhaar_otp/",
        method: "POST",
        TBody: Type<{
          aadhaar: string;
          transaction_id?: string;
        }>(),
        TRes: Type<{
          transaction_id: string;
          detail: string;
        }>(),
      },

      abhaCreateVerifyAadhaarOtp: {
        path: "/api/abdm/v3/health_id/create/verify_aadhaar_otp/",
        method: "POST",
        TBody: Type<{
          transaction_id: string;
          otp: string;
          mobile: string;
        }>(),
        TRes: Type<{
          transaction_id: string;
          detail: string;
          is_new: boolean;
          abha_number: AbhaNumberModel;
        }>(),
      },

      abhaCreateLinkMobileNumber: {
        path: "/api/abdm/v3/health_id/create/link_mobile_number/",
        method: "POST",
        TBody: Type<{
          transaction_id: string;
          mobile: string;
        }>(),
        TRes: Type<{
          transaction_id: string;
          detail: string;
        }>(),
      },

      abhaCreateVerifyMobileNumber: {
        path: "/api/abdm/v3/health_id/create/verify_mobile_otp/",
        method: "POST",
        TBody: Type<{
          transaction_id: string;
          otp: string;
        }>(),
        TRes: Type<{
          transaction_id: string;
          detail: string;
        }>(),
      },

      abhaCreateAbhaAddressSuggestion: {
        path: "/api/abdm/v3/health_id/create/abha_address_suggestion/",
        method: "POST",
        TBody: Type<{
          transaction_id: string;
        }>(),
        TRes: Type<{
          transaction_id: string;
          abha_addresses: string[];
        }>(),
      },

      abhaCreateEnrolAbhaAddress: {
        path: "/api/abdm/v3/health_id/create/enrol_abha_address/",
        method: "POST",
        TBody: Type<{
          transaction_id: string;
          abha_address: string;
        }>(),
        TRes: Type<{
          detail?: string;
          transaction_id: string;
          health_id: string;
          preferred_abha_address: string;
          abha_number: AbhaNumberModel;
        }>(),
      },

      linkAbhaNumberAndPatient: {
        path: "/api/abdm/v3/health_id/link_patient/",
        method: "POST",
        TBody: Type<{
          abha_number: string;
          patient: string;
        }>(),
        TRes: Type<{
          detail: string;
        }>(),
      },

      abhaLoginCheckAuthMethods: {
        path: "/api/abdm/v3/health_id/login/check_auth_methods/",
        method: "POST",
        TBody: Type<{
          abha_address: string;
        }>(),
        TRes: Type<{
          abha_number: string;
          auth_methods: string[];
        }>(),
      },

      abhaLoginSendOtp: {
        path: "/api/abdm/v3/health_id/login/send_otp/",
        method: "POST",
        TBody: Type<{
          type: "abha-number" | "abha-address" | "mobile" | "aadhaar";
          value: string;
          otp_system: "abdm" | "aadhaar";
        }>(),
        TRes: Type<{
          transaction_id: string;
          detail: string;
        }>(),
      },

      abhaLoginVerifyOtp: {
        path: "/api/abdm/v3/health_id/login/verify_otp/",
        method: "POST",
        TBody: Type<{
          type: "abha-number" | "abha-address" | "mobile" | "aadhaar";
          otp: string;
          transaction_id: string;
          otp_system: "abdm" | "aadhaar";
        }>(),
        TRes: Type<{
          abha_number: AbhaNumberModel;
          created: boolean;
        }>(),
      },

      getAbhaCard: {
        path: "/api/abdm/v3/health_id/abha_card",
        method: "GET",
        TRes: Type<Blob>(),
      },
    },
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
    TBody: Type<{
      discontinued_reason: string;
    }>(),
    TRes: Type<Record<string, never>>(),
  },

  // HCX Endpoints
  hcx: {
    policies: {
      list: {
        path: "/api/hcx/policy/",
        method: "GET",
        TRes: Type<PaginatedResponse<HCXPolicyModel>>(),
      },

      create: {
        path: "/api/hcx/policy/",
        method: "POST",
        TRes: Type<HCXPolicyModel>(),
      },

      get: {
        path: "/api/hcx/policy/{external_id}/",
        method: "GET",
      },

      update: {
        path: "/api/hcx/policy/{external_id}/",
        method: "PUT",
        TRes: Type<HCXPolicyModel>(),
      },

      partialUpdate: {
        path: "/api/hcx/policy/{external_id}/",
        method: "PATCH",
      },

      delete: {
        path: "/api/hcx/policy/{external_id}/",
        method: "DELETE",
        TRes: Type<Record<string, never>>(),
      },

      listPayors: {
        path: "/api/hcx/payors/",
        method: "GET",
        TRes: Type<InsurerOptionModel[]>(),
      },

      checkEligibility: {
        path: "/api/hcx/check_eligibility/",
        method: "POST",
        TBody: Type<{ policy: string }>(),
        TRes: Type<HCXPolicyModel>(),
      },
    },

    claims: {
      list: {
        path: "/api/hcx/claim/",
        method: "GET",
        TRes: Type<PaginatedResponse<HCXClaimModel>>(),
      },

      create: {
        path: "/api/hcx/claim/",
        method: "POST",
        TBody: Type<{
          policy: string;
          items: {
            id: string;
            price: number;
            category?: string;
            name: string;
          }[];
          consultation: string;
          use: "preauthorization" | "claim";
        }>(),
        TRes: Type<HCXClaimModel>(),
      },

      get: {
        path: "/api/hcx/claim/{external_id}/",
        method: "GET",
      },

      update: {
        path: "/api/hcx/claim/{external_id}/",
        method: "PUT",
      },

      partialUpdate: {
        path: "/api/hcx/claim/{external_id}/",
        method: "PATCH",
      },

      delete: {
        path: "/api/hcx/claim/{external_id}/",
        method: "DELETE",
      },

      listPMJYPackages: {
        path: "/api/hcx/pmjy_packages/",
        method: "GET",
        TRes: Type<PMJAYPackageItem[]>(),
      },

      makeClaim: {
        path: "/api/hcx/make_claim/",
        method: "POST",
        TBody: Type<{ claim: string }>(),
        TRes: Type<unknown>(),
      },
    },

    communications: {
      list: {
        path: "/api/hcx/communication/",
        method: "GET",
        TRes: Type<PaginatedResponse<HCXCommunicationModel>>(),
      },

      create: {
        path: "/api/hcx/communication/",
        method: "POST",
        TRes: Type<HCXCommunicationModel>(),
        TBody: Type<{
          claim: string;
          content: {
            type: string;
            data: string;
          }[];
        }>(),
      },

      get: {
        path: "/api/hcx/communication/{external_id}/",
        method: "GET",
        TRes: Type<HCXCommunicationModel>(),
      },

      update: {
        path: "/api/hcx/communication/{external_id}/",
        method: "PUT",
        TRes: Type<HCXCommunicationModel>(),
      },

      partialUpdate: {
        path: "/api/hcx/communication/{external_id}/",
        method: "PATCH",
        TRes: Type<HCXCommunicationModel>(),
      },

      delete: {
        path: "/api/hcx/communication/{external_id}/",
        method: "DELETE",
      },

      send: {
        path: "/api/hcx/send_communication/",
        method: "POST",
        TRes: Type<void>(),
        TBody: Type<{
          communication: string;
        }>(),
      },
    },
  },
} as const;

export default routes;
