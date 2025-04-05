import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  CreateValuesetModel,
  UpdateValuesetModel,
  ValuesetBase,
  ValuesetLookupRequest,
  ValuesetLookupResponse,
} from "./valueset";

export default {
  list: {
    path: "/api/v1/valueset/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ValuesetBase>>(),
  },
  create: {
    path: "/api/v1/valueset/",
    method: HttpMethod.POST,
    TRes: Type<ValuesetBase>(),
    TBody: Type<CreateValuesetModel>(),
  },
  get: {
    path: "/api/v1/valueset/{slug}/",
    method: HttpMethod.GET,
    TRes: Type<ValuesetBase>(),
  },
  update: {
    path: "/api/v1/valueset/{slug}/",
    method: HttpMethod.PUT,
    TRes: Type<ValuesetBase>(),
    TBody: Type<UpdateValuesetModel>(),
  },
  lookup: {
    path: "/api/v1/valueset/lookup_code/",
    method: HttpMethod.POST,
    TRes: Type<ValuesetLookupResponse>(),
    TBody: Type<ValuesetLookupRequest>(),
  },
  expand: {
    path: "/api/v1/valueset/expand/",
    method: HttpMethod.POST,
    TRes: Type<ValuesetBase>(),
    TBody: Type<{
      search: string;
    }>(),
  },
} as const;
