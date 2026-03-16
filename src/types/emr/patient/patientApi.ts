import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
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
  create: {
    path: "/api/v1/patient/",
    method: HttpMethod.POST,
    TBody: Type<PatientCreate>(),
    TRes: Type<PatientRead>(),
  },
  update: {
    path: "/api/v1/patient/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<PatientUpdate>(),
    TRes: Type<PatientRead>(),
  },
  list: {
    path: "/api/v1/patient/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PatientRead>>(),
  },
  get: {
    path: "/api/v1/patient/{id}/",
    method: HttpMethod.GET,
    TRes: Type<PatientRead>(),
    TQuery: Type<{ facility?: string }>(),
  },

  // Patient Search
  search: {
    path: "/api/v1/patient/search/",
    method: HttpMethod.POST,
    TBody: Type<PatientSearchRequest>(),
    TRes: Type<PatientSearchResponse>(),
  },

  searchRetrieve: {
    path: "/api/v1/patient/search_retrieve/",
    method: HttpMethod.POST,
    TBody: Type<PatientSearchRetrieveRequest>(),
    TRes: Type<PatientRead>(),
  },

  // User Management
  addUser: {
    path: "/api/v1/patient/{patientId}/add_user/",
    method: HttpMethod.POST,
    TBody: Type<{ user: string; role: string }>(),
    TRes: Type<UserReadMinimal>(),
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
    TBody: Type<{ tags: string[] }>(),
    TRes: Type<PatientRead>(),
  },
  removeInstanceTags: {
    path: "/api/v1/patient/{external_id}/remove_instance_tags/",
    method: HttpMethod.POST,
    TBody: Type<{ tags: string[] }>(),
    TRes: Type<PatientRead>(),
  },
  setFacilityTags: {
    path: "/api/v1/patient/{external_id}/set_facility_tags/",
    method: HttpMethod.POST,
    TBody: Type<{ tags: string[]; facility: string | null }>(),
    TRes: Type<PatientRead>(),
  },
  removeFacilityTags: {
    path: "/api/v1/patient/{external_id}/remove_facility_tags/",
    method: HttpMethod.POST,
    TBody: Type<{ tags: string[]; facility: string | null }>(),
    TRes: Type<PatientRead>(),
  },
} as const;
