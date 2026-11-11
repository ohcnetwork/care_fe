import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  ImmunizationPolicyCreate,
  ImmunizationPolicyRead,
  ImmunizationPolicyWrite,
} from "@/types/emr/immunizationPolicy/immunizationPolicy";

export default {
  list: {
    path: "/api/v1/immunization/policy/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ImmunizationPolicyRead>>(),
  },
  retrieve: {
    path: "/api/v1/immunization/policy/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ImmunizationPolicyRead>(),
  },
  create: {
    path: "/api/v1/immunization/policy/",
    method: HttpMethod.POST,
    TBody: Type<ImmunizationPolicyCreate>(),
    TRes: Type<ImmunizationPolicyRead>(),
  },
  update: {
    path: "/api/v1/immunization/policy/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<ImmunizationPolicyWrite>(),
    TRes: Type<ImmunizationPolicyRead>(),
  },
} as const;
