import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Organization } from "../organization/organization";
import {
  QuestionnaireCreate,
  QuestionnaireDetail,
  QuestionnaireUpdate,
} from "./questionnaire";
import { QuestionnaireTag } from "./tags";

export default {
  list: {
    path: "/api/v1/questionnaire/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<QuestionnaireDetail>>(),
  },

  detail: {
    path: "/api/v1/questionnaire/{id}/",
    method: HttpMethod.GET,
    TRes: Type<QuestionnaireDetail>(),
  },

  create: {
    path: "/api/v1/questionnaire/",
    method: HttpMethod.POST,
    TRes: Type<QuestionnaireDetail>(),
    TBody: Type<QuestionnaireCreate>(),
  },

  update: {
    path: "/api/v1/questionnaire/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<QuestionnaireUpdate>(),
    TBody: Type<QuestionnaireDetail>(),
  },

  partialUpdate: {
    path: "/api/v1/questionnaire/{id}/",
    method: HttpMethod.PATCH,
    TRes: Type<QuestionnaireDetail>(),
    TBody: Type<Partial<QuestionnaireDetail>>(),
  },

  delete: {
    path: "/api/v1/questionnaire/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
  },

  submit: {
    path: "/api/v1/questionnaire/{id}/submit/",
    method: HttpMethod.POST,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{
      resource_id: string;
      encounter?: string;
      patient: string;
      responses: Array<{
        question_id: string;
        value: string | number | boolean;
        note?: string;
        bodysite?: string;
        method?: string;
      }>;
    }>(),
  },
  getOrganizations: {
    path: "/api/v1/questionnaire/{id}/get_organizations/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
  setOrganizations: {
    path: "/api/v1/questionnaire/{id}/set_organizations/",
    method: HttpMethod.POST,
    TRes: Type<PaginatedResponse<Organization>>(),
    TBody: {} as { organizations: string[] },
  },

  tags: {
    list: {
      path: "/api/v1/questionnaire_tag/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<QuestionnaireTag>>(),
    },

    create: {
      path: "/api/v1/questionnaire_tag/",
      method: HttpMethod.POST,
      TRes: Type<QuestionnaireTag>(),
      TBody: Type<Omit<QuestionnaireTag, "id">>(),
    },

    update: {
      path: "/api/v1/questionnaire_tag/{slug}/",
      method: HttpMethod.PUT,
      TRes: Type<QuestionnaireTag>(),
      TBody: Type<QuestionnaireTag>(),
    },
  },
};
