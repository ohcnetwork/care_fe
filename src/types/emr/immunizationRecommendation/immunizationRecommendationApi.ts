import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  ImmunizationRecommendationCreate,
  ImmunizationRecommendationRead,
  ImmunizationRecommendationUpdate,
} from "@/types/emr/immunizationRecommendation/immunizationRecommendation";

export default {
  list: {
    path: "/api/v1/patient/{patientId}/immunization/recommendation/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ImmunizationRecommendationRead>>(),
  },
  retrieve: {
    path: "/api/v1/patient/{patientId}/immunization/recommendation/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ImmunizationRecommendationRead>(),
  },
  create: {
    path: "/api/v1/patient/{patientId}/immunization/recommendation/",
    method: HttpMethod.POST,
    TBody: Type<ImmunizationRecommendationCreate>(),
    TRes: Type<ImmunizationRecommendationRead>(),
  },
  update: {
    path: "/api/v1/patient/{patientId}/immunization/recommendation/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<ImmunizationRecommendationUpdate>(),
    TRes: Type<ImmunizationRecommendationRead>(),
  },
} as const;
