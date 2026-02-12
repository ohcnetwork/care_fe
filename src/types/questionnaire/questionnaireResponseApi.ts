import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { QuestionnaireResponse } from "./questionnaireResponse";

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
} as const;
