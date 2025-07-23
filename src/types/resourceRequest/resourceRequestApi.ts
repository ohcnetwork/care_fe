import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  CommentModel,
  CreateResourceRequest,
  ResourceRequest,
  UpdateResourceRequest,
} from "@/types/resourceRequest/resourceRequest";

export default {
  create: {
    path: "/api/v1/resource/",
    method: "POST",
    TRes: Type<ResourceRequest>(),
    TBody: Type<CreateResourceRequest>(),
  },
  update: {
    path: "/api/v1/resource/{id}/",
    method: "PUT",
    TRes: Type<ResourceRequest>(),
    TBody: Type<UpdateResourceRequest>(),
  },
  list: {
    path: "/api/v1/resource/",
    method: "GET",
    TRes: Type<PaginatedResponse<ResourceRequest>>(),
  },
  get: {
    path: "/api/v1/resource/{id}/",
    method: "GET",
    TRes: Type<ResourceRequest>(),
  },
  getComments: {
    path: "/api/v1/resource/{id}/comment/",
    method: "GET",
    TRes: Type<PaginatedResponse<CommentModel>>(),
  },
  addComments: {
    path: "/api/v1/resource/{id}/comment/",
    method: "POST",
    TRes: Type<CommentModel>(),
    TBody: Type<Partial<CommentModel>>(),
  },
} as const;
