import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Metrics } from "@/types/base/condition/condition";
import {
  ObservationDefinitionCreateSpec,
  ObservationDefinitionReadSpec,
} from "./observationDefinition";

export default {
  listObservationDefinition: {
    path: "/api/v1/observation_definition/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ObservationDefinitionReadSpec>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveObservationDefinition: {
    path: "/api/v1/observation_definition/{observationSlug}/",
    method: HttpMethod.GET,
    TRes: Type<ObservationDefinitionReadSpec>(),
  },
  createObservationDefinition: {
    path: "/api/v1/observation_definition/",
    method: HttpMethod.POST,
    TRes: Type<ObservationDefinitionCreateSpec>(),
  },
  updateObservationDefinition: {
    path: "/api/v1/observation_definition/{observationSlug}/",
    method: HttpMethod.PUT,
    TRes: Type<ObservationDefinitionReadSpec>(),
  },
  getAllMetrics: {
    path: "/api/v1/observation_definition/metrics/",
    method: HttpMethod.GET,
    TRes: Type<Metrics[]>(),
  },
} as const;
