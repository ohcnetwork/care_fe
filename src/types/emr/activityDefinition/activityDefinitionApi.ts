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
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveActivityDefinition: {
    path: "/api/v1/facility/{facilityId}/activity_definition/{activityDefinitionSlug}/",
    method: HttpMethod.GET,
    TRes: Type<ActivityDefinitionReadSpec>(),
  },
  createActivityDefinition: {
    path: "/api/v1/facility/{facilityId}/activity_definition/",
    method: HttpMethod.POST,
    TBody: Type<ActivityDefinitionCreateSpec>(),
    TRes: Type<ActivityDefinitionReadSpec>(),
  },
  updateActivityDefinition: {
    path: "/api/v1/facility/{facilityId}/activity_definition/{activityDefinitionSlug}/",
    method: HttpMethod.PUT,
    TBody: Type<ActivityDefinitionCreateSpec>(),
    TRes: Type<ActivityDefinitionReadSpec>(),
  },
} as const;
