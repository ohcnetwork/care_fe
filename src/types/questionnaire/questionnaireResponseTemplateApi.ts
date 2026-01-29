import {
  QuestionnaireResponseTemplateCreateSpec,
  QuestionnaireResponseTemplateReadSpec,
  QuestionnaireResponseTemplateRetrieveSpec,
  QuestionnaireResponseTemplateUpdateSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

export const questionnaireResponseTemplateApi = {
  list: {
    path: "/api/v1/questionnaire_response_template/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<QuestionnaireResponseTemplateReadSpec>>(),
    TQuery: Type<{
      questionnaire?: string;
      facility: string;
      name?: string;
      key_filter?: "medication_request" | "service_request" | "questionnaire";
      limit?: number;
      offset?: number;
    }>(),
  },
  retrieve: {
    path: "/api/v1/questionnaire_response_template/{id}/",
    method: HttpMethod.GET,
    TRes: Type<QuestionnaireResponseTemplateRetrieveSpec>(),
  },
  create: {
    path: "/api/v1/questionnaire_response_template/",
    method: HttpMethod.POST,
    TRes: Type<QuestionnaireResponseTemplateRetrieveSpec>(),
    TReq: Type<QuestionnaireResponseTemplateCreateSpec>(),
  },
  update: {
    path: "/api/v1/questionnaire_response_template/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<QuestionnaireResponseTemplateRetrieveSpec>(),
    TReq: Type<QuestionnaireResponseTemplateUpdateSpec>(),
  },
  delete: {
    path: "/api/v1/questionnaire_response_template/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
  },
} as const;
