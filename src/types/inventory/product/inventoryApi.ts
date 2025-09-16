import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { InventoryRead } from "@/types/inventory/product/inventory";

export default {
  list: {
    path: "/api/v1/facility/{facilityId}/location/{locationId}/product/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<InventoryRead>>(),
  },
} as const;
