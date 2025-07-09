import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  ObservationDefinitionCreateSpec,
  ObservationDefinitionReadSpec,
} from "./observationDefinition";

export default {
  listObservationDefinition: {
    path: "/api/v1/observation_definition/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ObservationDefinitionReadSpec>>(),
  },
  retrieveObservationDefinition: {
    path: "/api/v1/observation_definition/{observationDefinitionId}/",
    method: HttpMethod.GET,
    TRes: Type<ObservationDefinitionReadSpec>(),
  },
  createObservationDefinition: {
    path: "/api/v1/observation_definition/",
    method: HttpMethod.POST,
    TRes: Type<ObservationDefinitionCreateSpec>(),
  },
  updateObservationDefinition: {
    path: "/api/v1/observation_definition/{observationDefinitionId}/",
    method: HttpMethod.PUT,
    TRes: Type<ObservationDefinitionCreateSpec>(),
  },
} as const;
