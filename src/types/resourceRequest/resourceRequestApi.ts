import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  ResourceRequestCreate,
  ResourceRequestListRead,
  ResourceRequestRead,
} from "@/types/resourceRequest/resourceRequest";
import { CommentCreate, CommentRead } from "./resourceRequest";

export default {
  get: {
    path: "/api/v1/resource/{resourceRequestId}/",
    method: HttpMethod.GET,
    TRes: Type<ResourceRequestRead>(),
  },
  list: {
    path: "/api/v1/resource/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ResourceRequestListRead>>(),
  },
  create: {
    path: "/api/v1/resource/",
    method: HttpMethod.POST,
    TBody: Type<ResourceRequestCreate>(),
    TRes: Type<ResourceRequestRead>(),
  },
  update: {
    path: "/api/v1/resource/{resourceRequestId}/",
    method: HttpMethod.PUT,
    TBody: Type<ResourceRequestCreate>(),
    TRes: Type<ResourceRequestRead>(),
  },
} as const;

export const resourceRequestCommentApi = {
  list: {
    path: "/api/v1/resource/{resourceRequestId}/comment/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<CommentRead>>(),
  },
  create: {
    path: "/api/v1/resource/{resourceRequestId}/comment/",
    method: HttpMethod.POST,
    TBody: Type<CommentCreate>(),
    TRes: Type<CommentRead>(),
  },
} as const;
