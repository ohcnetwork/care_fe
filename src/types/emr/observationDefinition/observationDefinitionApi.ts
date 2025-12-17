import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

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
    TRes: Type<ObservationDefinitionRead>(),
    TBody: Type<ObservationDefinitionCreate>(),
  },
  update: {
    path: "/api/v1/observation_definition/{observationSlug}/",
    method: HttpMethod.PUT,
    TRes: Type<ObservationDefinitionRead>(),
    TBody: Type<ObservationDefinitionUpdate>(),
  },
  getAllMetrics: {
    path: "/api/v1/observation_definition/metrics/",
    method: HttpMethod.GET,
    TRes: Type<Metrics[]>(),
  },
} as const;
