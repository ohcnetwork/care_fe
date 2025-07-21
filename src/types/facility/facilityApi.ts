import { FacilityModel } from "@/components/Facility/models";
import { FacilityRequest } from "@/components/Facility/models";

import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";

import { BaseFacility, CreateFacility, FacilityData } from "./facility";

export default {
  create: {
    path: "/api/v1/facility/",
    method: HttpMethod.POST,
    TRes: Type<BaseFacility>(),
    TBody: Type<CreateFacility>(),
  },
  getAllFacilities: {
    path: "/api/v1/getallfacilities/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityData>>(),
  },
  deleteFacility: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
    TBody: Type<void>(),
  },
  getFacility: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.GET,
    TRes: Type<FacilityData>(),
  },
  patchInvoiceNumberExpression: {
    path: "/api/v1/facility/{id}/set_invoice_expression/",
    method: HttpMethod.POST,
    TRes: Type<FacilityData>(),
    TBody: Type<{
      invoice_number_expression: string;
    }>(),
  },
  updateFacility: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<FacilityModel>(),
    TBody: Type<FacilityRequest>(),
  },
  updateMonetaryComponents: {
    path: "/api/v1/facility/{facilityId}/set_monetary_codes/",
    method: HttpMethod.POST,
    TRes: Type<FacilityData>(),
    TBody: Type<{
      discount_codes: Code[];
      discount_monetary_components: MonetaryComponentRead[];
    }>(),
  },
} as const;
