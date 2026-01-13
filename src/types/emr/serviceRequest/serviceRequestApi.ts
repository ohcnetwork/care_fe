import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

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
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveServiceRequest: {
    path: "/api/v1/facility/{facilityId}/service_request/{serviceRequestId}/",
    method: HttpMethod.GET,
    TRes: Type<ServiceRequestReadSpec>(),
  },
  cancelServiceRequest: {
    path: "/api/v1/facility/{facilityId}/service_request/{serviceRequestId}/cancel/",
    method: HttpMethod.POST,
    TRes: Type<void>(),
  },
  completeServiceRequest: {
    path: "/api/v1/facility/{facilityId}/service_request/{serviceRequestId}/complete/",
    method: HttpMethod.POST,
    TRes: Type<void>(),
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
  setTags: {
    path: "/api/v1/facility/{facilityId}/service_request/{external_id}/set_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<{ tags: string[] }>(),
  },
  removeTags: {
    path: "/api/v1/facility/{facilityId}/service_request/{external_id}/remove_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<{ tags: string[] }>(),
  },
} as const;
