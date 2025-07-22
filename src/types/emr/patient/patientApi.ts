import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  Observation,
  ObservationAnalyzeResponse,
} from "@/types/emr/observation";
import { Message } from "@/types/notes/messages";
import { Thread } from "@/types/notes/threads";
import type { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { UserBase } from "@/types/user/user";

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
    TRes: Type<Thread>(),
    TBody: Type<{ title: string; encounter?: string }>(),
  },
  getMessages: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/note/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Message>>(),
  },
  postMessage: {
    path: "/api/v1/patient/{patientId}/thread/{threadId}/note/",
    method: HttpMethod.POST,
    TRes: Type<Message>(),
    TBody: Type<{ message: string }>(),
  },

  // User Management
  addUser: {
    path: "/api/v1/patient/{patientId}/add_user/",
    method: HttpMethod.POST,
    TRes: Type<UserBase>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  listUsers: {
    path: "/api/v1/patient/{patientId}/get_users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserBase>>(),
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
