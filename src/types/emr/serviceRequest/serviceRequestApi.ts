import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  ServiceRequestApplyActivityDefinitionSpec,
  ServiceRequestCreateSpec,
  ServiceRequestReadSpec,
  ServiceRequestUpdateSpec,
} from "./serviceRequest";

export default {
  listServiceRequest: {
    path: "/api/v1/facility/{facilityId}/service_request/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ServiceRequestReadSpec>>(),
  },
  retrieveServiceRequest: {
    path: "/api/v1/facility/{facilityId}/service_request/{serviceRequestId}/",
    method: HttpMethod.GET,
    TRes: Type<ServiceRequestReadSpec>(),
  },
  createServiceRequest: {
    path: "/api/v1/facility/{facilityId}/service_request/",
    method: HttpMethod.POST,
    TRes: Type<ServiceRequestCreateSpec>(),
  },
  updateServiceRequest: {
    path: "/api/v1/facility/{facilityId}/service_request/{serviceRequestId}/",
    method: HttpMethod.PUT,
    TRes: Type<ServiceRequestUpdateSpec>(),
  },
  applyActivityDefinition: {
    path: "/api/v1/facility/{facilityId}/service_request/apply_activity_definition/",
    method: HttpMethod.POST,
    TRes: Type<ServiceRequestApplyActivityDefinitionSpec>(),
  },
} as const;
