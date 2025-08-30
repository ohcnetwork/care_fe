import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";

import {
  ValueSetBase,
  ValueSetCreate,
  ValuesetLookupRequest,
  ValuesetLookupResponse,
  ValueSetRead,
  ValueSetUpdate,
} from "./valueset";

export default {
  list: {
    path: "/api/v1/valueset/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ValueSetRead>>(),
  },
  create: {
    path: "/api/v1/valueset/",
    method: HttpMethod.POST,
    TRes: Type<ValueSetRead>(),
    TBody: Type<ValueSetCreate>(),
  },
  get: {
    path: "/api/v1/valueset/{slug}/",
    method: HttpMethod.GET,
    TRes: Type<ValueSetRead>(),
  },
  update: {
    path: "/api/v1/valueset/{slug}/",
    method: HttpMethod.PUT,
    TRes: Type<ValueSetRead>(),
    TBody: Type<ValueSetUpdate>(),
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
    TRes: Type<ValueSetRead>(),
    TBody: Type<{
      search: string;
    }>(),
  },
  preview_search: {
    path: "/api/v1/valueset/preview_search/",
    method: HttpMethod.POST,
    TRes: Type<{ results: Code[] }>(),
    TBody: Type<ValueSetBase>(),
  },
  favourites: {
    path: "/api/v1/valueset/{slug}/favourites/",
    method: HttpMethod.GET,
    TRes: Type<Code[]>(),
  },
  addFavourite: {
    path: "/api/v1/valueset/{slug}/add_favourite/",
    method: HttpMethod.POST,
    TRes: Type<{ message: string }>(),
    TBody: Type<{ code: string }>(),
  },
  removeFavourite: {
    path: "/api/v1/valueset/{slug}/remove_favourite/",
    method: HttpMethod.POST,
    TRes: Type<{ message: string }>(),
    TBody: Type<{ code: string }>(),
  },
  clearFavourites: {
    path: "/api/v1/valueset/{slug}/clear_favourites/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<unknown>(),
  },
  recentViews: {
    path: "/api/v1/valueset/{slug}/recent_views/",
    method: HttpMethod.GET,
    TRes: Type<Code[]>(),
  },
  addRecentView: {
    path: "/api/v1/valueset/{slug}/add_recent_view/",
    method: HttpMethod.POST,
    TRes: Type<{ message: string }>(),
    TBody: Type<Code>(),
  },
  removeRecentView: {
    path: "/api/v1/valueset/{slug}/remove_recent_view/",
    method: HttpMethod.POST,
    TRes: Type<{ message: string }>(),
    TBody: Type<Code>(),
  },
  clearRecentViews: {
    path: "/api/v1/valueset/{slug}/clear_recent_views/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<unknown>(),
  },
} as const;
