import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  MetaArtifactResponse,
  MetaArtifactUpsertRequest,
} from "@/types/metaAritifact/metaArtifact";

export default {
  /**
   * Schedule Template related APIs
   */
  create: {
    path: "/api/v1/meta_artifacts/",
    method: HttpMethod.POST,
    TRes: Type<MetaArtifactResponse>(),
    TBody: Type<MetaArtifactUpsertRequest>(),
  },
  retrieve: {
    path: "/api/v1/meta_artifacts/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<MetaArtifactResponse>(),
  },
  list: {
    path: "/api/v1/meta_artifacts/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MetaArtifactResponse>>(),
  },
  update: {
    path: "/api/v1/meta_artifacts/{external_id}/",
    method: HttpMethod.PUT,
    TBody: Type<MetaArtifactUpsertRequest>(),
    TRes: Type<MetaArtifactResponse>(),
  },
  upsert: {
    path: "/api/v1/meta_artifacts/upsert/",
    method: HttpMethod.POST,
    TRes: Type<MetaArtifactResponse[]>(),
    TBody: Type<MetaArtifactUpsertRequest>(),
  },
} as const;
