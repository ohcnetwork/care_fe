import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  QuestionnaireResponse,
  QuestionnaireResponseUpdate,
} from "./questionnaireResponse";

export default {
  get: {
    path: "/api/v1/patient/{patientId}/questionnaire_response/{responseId}/",
    method: HttpMethod.GET,
    TRes: Type<QuestionnaireResponse>(),
  },
  list: {
    path: "/api/v1/patient/{patientId}/questionnaire_response/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<QuestionnaireResponse>>(),
  },
  update: {
    path: "/api/v1/patient/{patientId}/questionnaire_response/{responseId}/",
    method: HttpMethod.PUT,
    TBody: Type<QuestionnaireResponseUpdate>(),
    TRes: Type<QuestionnaireResponse>(),
  },
} as const;
