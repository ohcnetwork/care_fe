import { FacilityModel, FacilityRequest } from "@/components/Facility/models";

import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";

import { BaseFacility, CreateFacility, FacilityData } from "./facility";

export default {
  getAll: {
    path: "/api/v1/getallfacilities/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityData>>(),
  },
  list: {
    path: "/api/v1/facility/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<BaseFacility>>(),
  },
  create: {
    path: "/api/v1/facility/",
    method: HttpMethod.POST,
    TRes: Type<BaseFacility>(),
    TBody: Type<CreateFacility>(),
  },
  update: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<FacilityModel>(),
    TBody: Type<FacilityRequest>(),
  },
  delete: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
    TBody: Type<void>(),
  },
  get: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.GET,
    TRes: Type<FacilityData>(),
  },
  uploadCoverImage: {
    path: "/api/v1/facility/{id}/cover_image/",
    method: HttpMethod.POST,
    TRes: Type<FacilityData>(),
    TBody: Type<FormData>(),
  },
  deleteCoverImage: {
    path: "/api/v1/facility/{id}/cover_image/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
    TBody: Type<void>(),
  },
  setInvoiceExpression: {
    path: "/api/v1/facility/{id}/set_invoice_expression/",
    method: HttpMethod.POST,
    TRes: Type<FacilityData>(),
    TBody: Type<{
      invoice_number_expression: string;
    }>(),
  },
  setMonetaryComponents: {
    path: "/api/v1/facility/{facilityId}/set_monetary_codes/",
    method: HttpMethod.POST,
    TRes: Type<FacilityData>(),
    TBody: Type<{
      discount_codes: Code[];
      discount_monetary_components: MonetaryComponentRead[];
    }>(),
  },
} as const;
