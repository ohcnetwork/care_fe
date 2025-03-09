import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  DeviceDetail,
  DeviceList,
  DeviceLocationHistory,
  DeviceWrite,
} from "./device";

export default {
  list: {
    path: "/api/v1/facility/{facility_id}/device/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DeviceList>>(),
  },
  create: {
    path: "/api/v1/facility/{facility_id}/device/",
    method: HttpMethod.POST,
    TRes: Type<DeviceDetail>(),
    TBody: Type<DeviceWrite>(),
  },
  retrieve: {
    path: "/api/v1/facility/{facility_id}/device/{id}/",
    method: HttpMethod.GET,
    TRes: Type<DeviceDetail>(),
  },
  update: {
    path: "/api/v1/facility/{facility_id}/device/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<DeviceDetail>(),
    TBody: Type<DeviceWrite>(),
  },
  delete: {
    path: "/api/v1/facility/{facility_id}/device/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
    TBody: Type<void>(),
  },
  upsert: {
    path: "/api/v1/facility/{facility_id}/device/upsert/",
    method: HttpMethod.POST,
    TRes: Type<DeviceDetail>(),
    TBody: Type<DeviceWrite>(),
  },
  associateLocation: {
    path: "/api/v1/facility/{facility_id}/device/{id}/associate_location/",
    method: HttpMethod.POST,
    TRes: Type<DeviceDetail>(),
    TBody: Type<{ location: string }>(),
  },
  locationHistory: {
    path: "/api/v1/facility/{facilityId}/device/{id}/location_history/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DeviceLocationHistory>>(),
  },
};
