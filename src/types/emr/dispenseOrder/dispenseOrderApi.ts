import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  DispenseOrderBase,
  DispenseOrderCreate,
  DispenseOrderRead,
} from "./dispenseOrder";

export default {
  list: {
    path: "/api/v1/facility/{facilityId}/order/dispense/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DispenseOrderRead>>(),
  },
  create: {
    path: "/api/v1/facility/{facilityId}/order/dispense/",
    method: HttpMethod.POST,
    TRes: Type<DispenseOrderRead>(),
    TBody: Type<DispenseOrderCreate>(),
  },
  get: {
    path: "/api/v1/facility/{facilityId}/order/dispense/{id}/",
    method: HttpMethod.GET,
    TRes: Type<DispenseOrderRead>(),
  },
  update: {
    path: "/api/v1/facility/{facilityId}/order/dispense/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<DispenseOrderRead>(),
    TBody: Type<Omit<DispenseOrderBase, "id">>(),
  },
};
