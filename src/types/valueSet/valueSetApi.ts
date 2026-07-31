import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { CodeConceptMinimal } from "@/types/base/code/code";

import {
  ExpandRequest,
  ExpandSlugRequest,
  ExpandSlugResponse,
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
    path: "/api/v1/valueset/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ValueSetRead>(),
  },
  update: {
    path: "/api/v1/valueset/{id}/",
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
    path: "/api/v1/valueset/{id}/expand/",
    method: HttpMethod.POST,
    TBody: Type<ExpandRequest>(),
    TRes: Type<{ results: CodeConceptMinimal[] }>(),
  },
  expandSlug: {
    path: "/api/v1/valueset/expand_slug/",
    method: HttpMethod.POST,
    TBody: Type<ExpandSlugRequest>(),
    TRes: Type<ExpandSlugResponse>(),
  },
  previewSearch: {
    path: "/api/v1/valueset/preview_search/",
    method: HttpMethod.POST,
    TBody: Type<ValueSetBase>(),
    TRes: Type<{ results: CodeConceptMinimal[] }>(),
  },
  favourites: {
    path: "/api/v1/valueset/{id}/favourites/",
    method: HttpMethod.GET,
    TRes: Type<CodeConceptMinimal[]>(),
  },
  // Resolves the slug server-side, so favourites can load without first
  // waiting on expand_slug.
  favouritesBySlug: {
    path: "/api/v1/valueset/favourites_by_slug/",
    method: HttpMethod.GET,
    TRes: Type<CodeConceptMinimal[]>(),
  },
  addFavourite: {
    path: "/api/v1/valueset/{id}/add_favourite/",
    method: HttpMethod.POST,
    TBody: Type<CodeConceptMinimal>(),
    TRes: Type<{ message: string }>(),
  },
  removeFavourite: {
    path: "/api/v1/valueset/{id}/remove_favourite/",
    method: HttpMethod.POST,
    TBody: Type<CodeConceptMinimal>(),
    TRes: Type<{ message: string }>(),
  },
  clearFavourites: {
    path: "/api/v1/valueset/{id}/clear_favourites/",
    method: HttpMethod.POST,
    TBody: Type<void>(),
    TRes: Type<{ message: string }>(),
  },
  recentViews: {
    path: "/api/v1/valueset/{id}/recent_views/",
    method: HttpMethod.GET,
    TRes: Type<CodeConceptMinimal[]>(),
  },
  recentViewsBySlug: {
    path: "/api/v1/valueset/recent_views_by_slug/",
    method: HttpMethod.GET,
    TRes: Type<CodeConceptMinimal[]>(),
  },
  addRecentView: {
    path: "/api/v1/valueset/{id}/add_recent_view/",
    method: HttpMethod.POST,
    TBody: Type<CodeConceptMinimal>(),
    TRes: Type<{ message: string }>(),
  },
  removeRecentView: {
    path: "/api/v1/valueset/{id}/remove_recent_view/",
    method: HttpMethod.POST,
    TBody: Type<CodeConceptMinimal>(),
    TRes: Type<{ message: string }>(),
  },
  clearRecentViews: {
    path: "/api/v1/valueset/{id}/clear_recent_views/",
    method: HttpMethod.POST,
    TBody: Type<void>(),
    TRes: Type<{ message: string }>(),
  },
} as const;
