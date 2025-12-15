import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  Observation,
  ObservationAnalyzeResponse,
} from "@/types/emr/observation";
import { Message } from "@/types/notes/messages";
import { Thread } from "@/types/notes/threads";
import type { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
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

  // Questionnaire Responses
  getQuestionnaireResponses: {
    path: "/api/v1/patient/{patientId}/questionnaire_response/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<QuestionnaireResponse>>(),
  },
  getQuestionnaireResponse: {
    path: "/api/v1/patient/{patientId}/questionnaire_response/{responseId}/",
    method: HttpMethod.GET,
    TRes: Type<QuestionnaireResponse>(),
  },

  // Observations
  listObservations: {
    path: "/api/v1/patient/{patientId}/observation/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Observation>>(),
  },
  observationsAnalyse: {
    path: "/api/v1/patient/{patientId}/observation/analyse/",
    method: HttpMethod.POST,
    TRes: Type<ObservationAnalyzeResponse>(),
  },

  // Notes and Threads
  listThreads: {
    path: "/api/v1/patient/{patientId}/thread/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Thread>>(),
  },
  createThread: {
    path: "/api/v1/patient/{patientId}/thread/",
    method: HttpMethod.POST,
    TBody: Type<{ title: string; encounter?: string }>(),
    TRes: Type<Thread>(),
  },
  getMessages: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/note/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Message>>(),
  },
  postMessage: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/note/",
    method: HttpMethod.POST,
    TBody: Type<{ message: string }>(),
    TRes: Type<Message>(),
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
} as const;
