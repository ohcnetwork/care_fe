import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";
import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";
import { UserReadMinimal } from "@/types/user/user";

export interface ResourceQuestionnaireAnswerValue {
  // The resource response API omits fields equal to their default values.
  value?: string | null;
  unit?: Code | null;
  coding?: Code | null;
}

export interface ResourceQuestionnaireAnswer {
  question_id: string;
  values?: ResourceQuestionnaireAnswerValue[];
  note?: string | null;
  sub_results?: ResourceQuestionnaireAnswer[][];
}

export interface ResourceQuestionnaireResponse {
  id: string;
  subject_id: string;
  questionnaire: QuestionnaireRead;
  status: QuestionnaireResponseStatus;
  responses: ResourceQuestionnaireAnswer[];
  created_by: UserReadMinimal | null;
  created_date: string | null;
}

export default {
  get: {
    path: "/api/v1/resource_responses/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ResourceQuestionnaireResponse>(),
  },
  list: {
    path: "/api/v1/resource_responses/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ResourceQuestionnaireResponse>>(),
  },
} as const;
