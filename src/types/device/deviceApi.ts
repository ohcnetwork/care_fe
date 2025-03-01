import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { DeviceDetail, DeviceList, DeviceWrite } from "./device";

// Service History API Interfaces
interface ServiceHistoryResponse {
  id: string;
  serviced_on: string;
  note: string;
  meta: Record<string, any>;
}

interface ServiceHistoryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ServiceHistoryResponse[];
}

interface ServiceHistoryCreateUpdateRequest {
  serviced_on: string;
  note: string;
  meta?: Record<string, any>;
}

// Device API with Service History
const deviceApi = {
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

  // Service History API
  serviceHistory: {
    list: {
      path: "/api/v1/facility/{facility_external_id}/device/{device_external_id}/service_history/",
      method: HttpMethod.GET,
      TRes: {} as ServiceHistoryListResponse,
      TReq: {},
    },
    retrieve: {
      method: HttpMethod.GET,
      path: "/api/v1/facility/{facility_external_id}/device/{device_external_id}/service_history/{external_id}/",
      TRes: {} as ServiceHistoryResponse,
      TReq: {},
    },
    create: {
      method: HttpMethod.POST,
      path: "/api/v1/facility/{facility_external_id}/device/{device_external_id}/service_history/",
      TRes: {} as ServiceHistoryResponse,
      TReq: {} as ServiceHistoryCreateUpdateRequest,
    },
    update: {
      method: HttpMethod.PUT,
      path: "/api/v1/facility/{facility_external_id}/device/{device_external_id}/service_history/{external_id}/",
      TRes: {} as ServiceHistoryResponse,
      TReq: {} as ServiceHistoryCreateUpdateRequest,
    },
    delete: {
      method: HttpMethod.DELETE,
      path: "/api/v1/facility/{facility_external_id}/device/{device_external_id}/service_history/{external_id}/",
      TRes: Type<void>(),
    },
  },
};

export default deviceApi;
