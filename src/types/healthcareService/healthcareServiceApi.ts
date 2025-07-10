import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  HealthcareServiceCreateSpec,
  HealthcareServiceReadSpec,
  HealthcareServiceUpdateSpec,
} from "./healthcareService";

export default {
  listHealthcareService: {
    path: "/api/v1/facility/{facilityId}/healthcare_service/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<HealthcareServiceReadSpec>>(),
  },
  retrieveHealthcareService: {
    path: "/api/v1/facility/{facilityId}/healthcare_service/{healthcareServiceId}/",
    method: HttpMethod.GET,
    TRes: Type<HealthcareServiceReadSpec>(),
  },
  createHealthcareService: {
    path: "/api/v1/facility/{facilityId}/healthcare_service/",
    method: HttpMethod.POST,
    TRes: Type<HealthcareServiceCreateSpec>(),
  },
  updateHealthcareService: {
    path: "/api/v1/facility/{facilityId}/healthcare_service/{healthcareServiceId}/",
    method: HttpMethod.PUT,
    TRes: Type<HealthcareServiceUpdateSpec>(),
  },
} as const;
