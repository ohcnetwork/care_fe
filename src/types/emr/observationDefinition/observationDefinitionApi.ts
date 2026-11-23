import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import { Metrics } from "@/types/base/condition/condition";
import {
  ObservationDefinitionCreate,
  ObservationDefinitionRead,
  ObservationDefinitionUpdate,
} from "./observationDefinition";

export default {
  list: {
    path: "/api/v1/observation_definition/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ObservationDefinitionRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  get: {
    path: "/api/v1/observation_definition/{observationSlug}/",
    method: HttpMethod.GET,
    TRes: Type<ObservationDefinitionRead>(),
  },
  create: {
    path: "/api/v1/observation_definition/",
    method: HttpMethod.POST,
    TBody: Type<ObservationDefinitionCreate>(),
    TRes: Type<ObservationDefinitionRead>(),
  },
  update: {
    path: "/api/v1/observation_definition/{observationSlug}/",
    method: HttpMethod.PUT,
    TBody: Type<ObservationDefinitionUpdate>(),
    TRes: Type<ObservationDefinitionRead>(),
  },
  getAllMetrics: {
    path: "/api/v1/observation_definition/metrics/",
    method: HttpMethod.GET,
    TRes: Type<Metrics[]>(),
  },
} as const;
