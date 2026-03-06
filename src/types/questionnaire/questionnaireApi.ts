import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { Organization } from "@/types/organization/organization";

import {
  QuestionnaireCreate,
  QuestionnaireRead,
  QuestionnaireSetOrganizations,
  QuestionnaireUpdate,
} from "./questionnaire";
import {
  QuestionnaireTagBase,
  QuestionnaireTagRead,
  QuestionnaireTagSet,
} from "./tags";

export default {
  list: {
    path: "/api/v1/questionnaire/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<QuestionnaireRead>>(),
  },
  get: {
    path: "/api/v1/questionnaire/{slug}/",
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
    path: "/api/v1/questionnaire/{slug}/",
    method: HttpMethod.PUT,
    TBody: Type<QuestionnaireUpdate>(),
    TRes: Type<QuestionnaireRead>(),
  },
  partialUpdate: {
    path: "/api/v1/questionnaire/{slug}/",
    method: HttpMethod.PATCH,
    TBody: Type<Partial<QuestionnaireRead>>(),
    TRes: Type<QuestionnaireRead>(),
  },
  delete: {
    path: "/api/v1/questionnaire/{slug}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
  },

  submit: {
    path: "/api/v1/questionnaire/{slug}/submit/",
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
    path: "/api/v1/questionnaire/{slug}/get_organizations/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
  setOrganizations: {
    path: "/api/v1/questionnaire/{slug}/set_organizations/",
    method: HttpMethod.POST,
    TBody: Type<QuestionnaireSetOrganizations>(),
    TRes: Type<PaginatedResponse<Organization>>(),
  },

  setTags: {
    path: "/api/v1/questionnaire/{slug}/set_tags/",
    method: HttpMethod.POST,
    TBody: Type<QuestionnaireTagSet>(),
    TRes: Type<void>(),
  },

  addFavorite: {
    path: "/api/v1/questionnaire/{slug}/add_favorite/",
    method: HttpMethod.POST,
    TRes: Type<QuestionnaireRead>(),
  },
  removeFavorite: {
    path: "/api/v1/questionnaire/{slug}/remove_favorite/",
    method: HttpMethod.POST,
    TRes: Type<QuestionnaireRead>(),
  },
  listFavorites: {
    path: "/api/v1/questionnaire/favorite_lists/",
    method: HttpMethod.GET,
    TRes: Type<string[]>(),
  },

  tags: {
    list: {
      path: "/api/v1/questionnaire_tag/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<QuestionnaireTagRead>>(),
    },
    create: {
      path: "/api/v1/questionnaire_tag/",
      method: HttpMethod.POST,
      TBody: Type<QuestionnaireTagBase>(),
      TRes: Type<QuestionnaireTagRead>(),
    },
    update: {
      path: "/api/v1/questionnaire_tag/{slug}/",
      method: HttpMethod.PUT,
      TBody: Type<QuestionnaireTagBase>(),
      TRes: Type<QuestionnaireTagRead>(),
    },
  },
} as const;
