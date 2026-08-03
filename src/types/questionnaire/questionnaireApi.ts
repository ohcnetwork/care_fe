import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { Organization } from "@/types/organization/organization";

import {
  QuestionnaireCreate,
  QuestionnaireCreateV2,
  QuestionnaireRead,
  QuestionnaireSetFacilityOrganizations,
  QuestionnaireSetOrganizations,
  QuestionnaireUpdate,
} from "./questionnaire";

/** One serialized answer value inside a `SubmitResult` — the shape
 *  `serializeResponseValues`
 *  (`components/QuestionnaireV2/fill/submit/serializeValues.ts`) produces:
 *  value-, coding- and unit-carrying entries, already formatted for the
 *  wire (dates collapsed, times normalized, etc). Ground truth for this
 *  shape is that serializer's output, not this file. */
export interface SubmitResultValue {
  value?: string | number | boolean;
  unit?: Code;
  coding?: Code;
}

/** One question's answer(s) in a submit request body — `care/emr/resources/
 *  questionnaire_response/spec.py: QuestionnaireResponseSubmitRequest`. */
export interface SubmitResult {
  question_id: string;
  values: SubmitResultValue[];
  note?: string;
  body_site?: Code;
  method?: Code;
  taken_at?: string;
}

/** Patient/encounter-bound submit body —
 *  `care/emr/resources/questionnaire_response/spec.py:
 *  QuestionnaireSubmitRequest`. Built by `composeBatch` for both a fresh
 *  submission and one linked to a resumed server draft via
 *  `form_submission`. */
export interface QuestionnaireSubmitBody {
  resource_id: string;
  patient?: string;
  encounter?: string;
  form_submission?: string;
  results: SubmitResult[];
}

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
    TBody: Type<QuestionnaireSubmitBody>(),
  },
  /** Resource subjects (location/device/facility) — no patient, no
   *  encounter. `care/emr/resources/questionnaire_response/resource_spec.py:
   *  ResourceQuestionnaireSubmitRequest`. */
  submitResource: {
    path: "/api/v1/questionnaire/{id}/submit_resource/",
    method: HttpMethod.POST,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{
      resource_id: string;
      results: SubmitResult[];
    }>(),
  },
  createV2: {
    path: "/api/v1/questionnaire/",
    method: HttpMethod.POST,
    TBody: Type<QuestionnaireCreateV2>(),
    TRes: Type<QuestionnaireRead>(),
  },
  getFacilityOrganizations: {
    path: "/api/v1/questionnaire/{id}/get_facility_organizations/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityOrganizationRead>>(),
  },
  setFacilityOrganizations: {
    path: "/api/v1/questionnaire/{id}/set_facility_organizations/",
    method: HttpMethod.POST,
    TBody: Type<QuestionnaireSetFacilityOrganizations>(),
    TRes: Type<Record<string, never>>(),
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
