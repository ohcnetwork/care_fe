import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";
import { UserReadMinimal } from "@/types/user/user";

import { FacilityCreate, FacilityListRead, FacilityRead } from "./facility";

export default {
  list: {
    path: "/api/v1/facility/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityListRead>>(),
  },
  create: {
    path: "/api/v1/facility/",
    method: HttpMethod.POST,
    TRes: Type<FacilityRead>(),
    TBody: Type<FacilityCreate>(),
  },
  update: {
    path: "/api/v1/facility/{facilityId}/",
    method: HttpMethod.PUT,
    TRes: Type<FacilityRead>(),
    TBody: Type<FacilityCreate>(),
  },
  delete: {
    path: "/api/v1/facility/{facilityId}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
    TBody: Type<void>(),
  },
  get: {
    path: "/api/v1/facility/{facilityId}/",
    method: HttpMethod.GET,
    TRes: Type<FacilityRead>(),
  },
  uploadCoverImage: {
    path: "/api/v1/facility/{facilityId}/cover_image/",
    method: HttpMethod.POST,
    TRes: Type<FacilityRead>(),
    TBody: Type<FormData>(),
  },
  deleteCoverImage: {
    path: "/api/v1/facility/{facilityId}/cover_image/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
    TBody: Type<void>(),
  },
  setInvoiceExpression: {
    path: "/api/v1/facility/{facilityId}/set_invoice_expression/",
    method: HttpMethod.POST,
    TRes: Type<FacilityRead>(),
    TBody: Type<{
      invoice_number_expression: string;
    }>(),
  },
  setMonetaryComponents: {
    path: "/api/v1/facility/{facilityId}/set_monetary_codes/",
    method: HttpMethod.POST,
    TRes: Type<FacilityRead>(),
    TBody: Type<{
      discount_codes: Code[];
      discount_monetary_components: MonetaryComponentRead[];
    }>(),
  },
  getUsers: {
    path: "/api/v1/facility/{facilityId}/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserReadMinimal>>(),
  },
} as const;
