import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  FormSubmissionCreate,
  FormSubmissionRead,
  FormSubmissionUpdate,
} from "./formSubmission";

export default {
  list: {
    path: "/api/v1/form_submission/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FormSubmissionRead>>(),
  },
  create: {
    path: "/api/v1/form_submission/",
    method: HttpMethod.POST,
    TBody: Type<FormSubmissionCreate>(),
    TRes: Type<FormSubmissionRead>(),
  },
  get: {
    path: "/api/v1/form_submission/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<FormSubmissionRead>(),
  },
  update: {
    path: "/api/v1/form_submission/{external_id}/",
    method: HttpMethod.PUT,
    TBody: Type<FormSubmissionUpdate>(),
    TRes: Type<FormSubmissionRead>(),
  },
  partialUpdate: {
    path: "/api/v1/form_submission/{external_id}/",
    method: HttpMethod.PATCH,
    TBody: Type<Partial<FormSubmissionUpdate>>(),
    TRes: Type<FormSubmissionRead>(),
  },
} as const;
