import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  DeviceDetail,
  DeviceEncounterHistory,
  DeviceList,
  DeviceLocationHistory,
  DeviceWrite,
  ServiceHistory,
  ServiceHistoryWriteRequest,
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
    TBody: Type<{ location: string | null }>(),
  },
  serviceHistory: {
    list: {
      path: "/api/v1/facility/{facilityId}/device/{deviceId}/service_history/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<ServiceHistory>>(),
    },
    retrieve: {
      method: HttpMethod.GET,
      path: "/api/v1/facility/{facilityId}/device/{deviceId}/service_history/{id}/",
      TRes: Type<ServiceHistory>(),
    },
    create: {
      method: HttpMethod.POST,
      path: "/api/v1/facility/{facilityId}/device/{deviceId}/service_history/",
      TRes: Type<ServiceHistory>(),
      TBody: Type<ServiceHistoryWriteRequest>(),
    },
    update: {
      method: HttpMethod.PUT,
      path: "/api/v1/facility/{facilityId}/device/{deviceId}/service_history/{id}/",
      TRes: Type<ServiceHistory>(),
      TBody: Type<ServiceHistoryWriteRequest>(),
    },
  },
  associateEncounter: {
    path: "/api/v1/facility/{facilityId}/device/{deviceId}/associate_encounter/",
    method: HttpMethod.POST,
    TRes: Type<DeviceDetail>(),
    TBody: Type<{ encounter: string | null }>(),
  },
  encounterHistory: {
    path: "/api/v1/facility/{facilityId}/device/{deviceId}/encounter_history/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DeviceEncounterHistory>>(),
  },
  addOrganization: {
    path: "/api/v1/facility/{facilityId}/device/{id}/add_managing_organization/",
    method: HttpMethod.POST,
    TRes: Type<DeviceDetail>(),
    TBody: Type<{ managing_organization: string }>(),
  },
  removeOrganization: {
    path: "/api/v1/facility/{facilityId}/device/{id}/remove_managing_organization/",
    method: HttpMethod.POST,
    TRes: Type<DeviceDetail>(),
    TBody: Type<{ managing_organization: string }>(),
  },
  locationHistory: {
    path: "/api/v1/facility/{facilityId}/device/{id}/location_history/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DeviceLocationHistory>>(),
  },
};
