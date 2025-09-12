import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { UserReadMinimal } from "@/types/user/user";

import {
  PatientCreate,
  PatientRead,
  PatientSearchRequest,
  PatientSearchResponse,
  PatientSearchRetrieveRequest,
  PatientUpdate,
} from "./patient";

export default {
  addPatient: {
    path: "/api/v1/patient/",
    method: HttpMethod.POST,
    TBody: Type<PatientCreate>(),
    TRes: Type<PatientRead>(),
  },

  updatePatient: {
    path: "/api/v1/patient/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<PatientRead>(),
    TBody: Type<PatientUpdate>(),
  },
  listPatient: {
    path: "/api/v1/patient/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PatientRead>>(),
  },
  getPatient: {
    path: "/api/v1/patient/{id}/",
    method: HttpMethod.GET,
    TRes: Type<PatientRead>(),
  },

  // Patient Search
  searchPatient: {
    path: "/api/v1/patient/search/",
    method: HttpMethod.POST,
    TRes: Type<PatientSearchResponse>(),
    TBody: Type<PatientSearchRequest>(),
  },

  searchRetrieve: {
    path: "/api/v1/patient/search_retrieve/",
    method: HttpMethod.POST,
    TRes: Type<PatientRead>(),
    TBody: Type<PatientSearchRetrieveRequest>(),
  },

  // User Management
  addUser: {
    path: "/api/v1/patient/{patientId}/add_user/",
    method: HttpMethod.POST,
    TRes: Type<UserReadMinimal>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  listUsers: {
    path: "/api/v1/patient/{patientId}/get_users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserReadMinimal>>(),
  },
  removeUser: {
    path: "/api/v1/patient/{patientId}/delete_user/",
    method: HttpMethod.POST,
    TRes: Type<{ user: string }>(),
  },

  // Tag-related endpoints
  setInstanceTags: {
    path: "/api/v1/patient/{external_id}/set_instance_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<{ tags: string[] }>(),
  },
  removeInstanceTags: {
    path: "/api/v1/patient/{external_id}/remove_instance_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<{ tags: string[] }>(),
  },
} as const;
