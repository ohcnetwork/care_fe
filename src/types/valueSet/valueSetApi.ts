import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";

import {
  ExpandRequest,
  ValueSetBase,
  ValueSetCreate,
  ValueSetLookupRequest,
  ValueSetLookupResponse,
  ValueSetRead,
  ValueSetUpdate,
} from "@/types/valueSet/valueSet";

export default {
  list: {
    path: "/api/v1/valueset/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ValueSetRead>>(),
  },
  create: {
    path: "/api/v1/valueset/",
    method: HttpMethod.POST,
    TBody: Type<ValueSetCreate>(),
    TRes: Type<ValueSetRead>(),
  },
  get: {
    path: "/api/v1/valueset/{slug}/",
    method: HttpMethod.GET,
    TRes: Type<ValueSetRead>(),
  },
  update: {
    path: "/api/v1/valueset/{slug}/",
    method: HttpMethod.PUT,
    TBody: Type<ValueSetUpdate>(),
    TRes: Type<ValueSetRead>(),
  },
  lookup: {
    path: "/api/v1/valueset/lookup_code/",
    method: HttpMethod.POST,
    TBody: Type<ValueSetLookupRequest>(),
    TRes: Type<ValueSetLookupResponse>(),
  },
  expand: {
    path: "/api/v1/valueset/{slug}/expand/",
    method: HttpMethod.POST,
    TBody: Type<ExpandRequest>(),
    TRes: Type<{ results: Code[] }>(),
  },
  previewSearch: {
    path: "/api/v1/valueset/preview_search/",
    method: HttpMethod.POST,
    TBody: Type<ValueSetBase>(),
    TRes: Type<{ results: Code[] }>(),
  },
  favourites: {
    path: "/api/v1/valueset/{slug}/favourites/",
    method: HttpMethod.GET,
    TRes: Type<Code[]>(),
  },
  addFavourite: {
    path: "/api/v1/valueset/{slug}/add_favourite/",
    method: HttpMethod.POST,
    TBody: Type<Code>(),
    TRes: Type<{ message: string }>(),
  },
  removeFavourite: {
    path: "/api/v1/valueset/{slug}/remove_favourite/",
    method: HttpMethod.POST,
    TBody: Type<Code>(),
    TRes: Type<{ message: string }>(),
  },
  clearFavourites: {
    path: "/api/v1/valueset/{slug}/clear_favourites/",
    method: HttpMethod.POST,
    TBody: Type<void>(),
    TRes: Type<{ message: string }>(),
  },
  recentViews: {
    path: "/api/v1/valueset/{slug}/recent_views/",
    method: HttpMethod.GET,
    TRes: Type<Code[]>(),
  },
  addRecentView: {
    path: "/api/v1/valueset/{slug}/add_recent_view/",
    method: HttpMethod.POST,
    TBody: Type<Code>(),
    TRes: Type<{ message: string }>(),
  },
  removeRecentView: {
    path: "/api/v1/valueset/{slug}/remove_recent_view/",
    method: HttpMethod.POST,
    TBody: Type<Code>(),
    TRes: Type<{ message: string }>(),
  },
  clearRecentViews: {
    path: "/api/v1/valueset/{slug}/clear_recent_views/",
    method: HttpMethod.POST,
    TBody: Type<void>(),
    TRes: Type<{ message: string }>(),
  },
} as const;
