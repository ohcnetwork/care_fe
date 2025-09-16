import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  ProductCreate,
  ProductRead,
  ProductUpdate,
} from "@/types/inventory/product/product";

export default {
  listProduct: {
    path: "/api/v1/facility/{facilityId}/product/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ProductRead>>(),
  },
  retrieveProduct: {
    path: "/api/v1/facility/{facilityId}/product/{productId}/",
    method: HttpMethod.GET,
    TRes: Type<ProductRead>(),
  },
  createProduct: {
    path: "/api/v1/facility/{facilityId}/product/",
    method: HttpMethod.POST,
    TRes: Type<ProductRead>(),
    TBody: Type<ProductCreate>(),
  },
  updateProduct: {
    path: "/api/v1/facility/{facilityId}/product/{productId}/",
    method: HttpMethod.PUT,
    TRes: Type<ProductRead>(),
    TBody: Type<ProductUpdate>(),
  },
} as const;
