import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  ImmunizationCreate,
  ImmunizationRead,
  ImmunizationWrite,
} from "@/types/emr/immunization/immunization";

export default {
  list: {
    path: "/api/v1/patient/{patientId}/immunization/record/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ImmunizationRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieve: {
    path: "/api/v1/patient/{patientId}/immunization/record/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ImmunizationRead>(),
  },
  create: {
    path: "/api/v1/patient/{patientId}/immunization/record/",
    method: HttpMethod.POST,
    TBody: Type<ImmunizationCreate>(),
    TRes: Type<ImmunizationRead>(),
  },
  update: {
    path: "/api/v1/patient/{patientId}/immunization/record/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<ImmunizationWrite>(),
    TRes: Type<ImmunizationRead>(),
  },
} as const;
