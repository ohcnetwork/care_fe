import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { Organization } from "@/types/organization/organization";

import {
  QuestionnaireCreate,
  QuestionnaireRead,
  QuestionnaireSetOrganizations,
  QuestionnaireUpdate,
} from "./questionnaire";

export default {
  list: {
    path: "/api/v1/questionnaire/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<QuestionnaireRead>>(),
  },
  get: {
    path: "/api/v1/questionnaire/{id}/",
    method: HttpMethod.GET,
    TRes: Type<QuestionnaireRead>(),
  },
  create: {
    path: "/api/v1/questionnaire/",
    method: HttpMethod.POST,
    TBody: Type<QuestionnaireCreate>(),
    TRes: Type<QuestionnaireRead>(),
  },
  update: {
    path: "/api/v1/questionnaire/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<QuestionnaireUpdate>(),
    TRes: Type<QuestionnaireRead>(),
  },
  partialUpdate: {
    path: "/api/v1/questionnaire/{id}/",
    method: HttpMethod.PATCH,
    TBody: Type<Partial<QuestionnaireRead>>(),
    TRes: Type<QuestionnaireRead>(),
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
    TBody: Type<QuestionnaireSetOrganizations>(),
    TRes: Type<PaginatedResponse<Organization>>(),
  },

  addFavorite: {
    path: "/api/v1/questionnaire/{id}/add_favorite/",
    method: HttpMethod.POST,
    TRes: Type<QuestionnaireRead>(),
  },
  removeFavorite: {
    path: "/api/v1/questionnaire/{id}/remove_favorite/",
    method: HttpMethod.POST,
    TRes: Type<QuestionnaireRead>(),
  },
  listFavorites: {
    path: "/api/v1/questionnaire/favorite_lists/",
    method: HttpMethod.GET,
    TRes: Type<string[]>(),
  },
} as const;
