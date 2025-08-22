import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  ActivityDefinitionCreateSpec,
  ActivityDefinitionReadSpec,
} from "./activityDefinition";

export default {
  listActivityDefinition: {
    path: "/api/v1/facility/{facilityId}/activity_definition/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ActivityDefinitionReadSpec>>(),
  },
  retrieveActivityDefinition: {
    path: "/api/v1/facility/{facilityId}/activity_definition/{activityDefinitionId}/",
    method: HttpMethod.GET,
    TRes: Type<ActivityDefinitionReadSpec>(),
  },
  createActivityDefinition: {
    path: "/api/v1/facility/{facilityId}/activity_definition/",
    method: HttpMethod.POST,
    TRes: Type<ActivityDefinitionCreateSpec>(),
  },
  updateActivityDefinition: {
    path: "/api/v1/facility/{facilityId}/activity_definition/{activityDefinitionId}/",
    method: HttpMethod.PUT,
    TRes: Type<ActivityDefinitionCreateSpec>(),
  },
} as const;
