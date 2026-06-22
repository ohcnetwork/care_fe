import {
  MetaArtifactCreateRequest,
  MetaArtifactRead,
  MetaArtifactUpdateRequest,
} from "@/types/metaArtifact/metaArtifact";
import {
  HttpMethod,
  PaginatedResponse,
  Type,
  UpsertRequest,
} from "@/Utils/request/types";

export default {
  create: {
    path: "/api/v1/meta_artifacts/",
    method: HttpMethod.POST,
    TRes: Type<MetaArtifactRead>(),
    TBody: Type<MetaArtifactCreateRequest>(),
  },
  retrieve: {
    path: "/api/v1/meta_artifacts/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<MetaArtifactRead>(),
  },
  list: {
    path: "/api/v1/meta_artifacts/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MetaArtifactRead>>(),
  },
  update: {
    path: "/api/v1/meta_artifacts/{external_id}/",
    method: HttpMethod.PUT,
    TBody: Type<MetaArtifactUpdateRequest>(),
    TRes: Type<MetaArtifactRead>(),
  },
  upsert: {
    path: "/api/v1/meta_artifacts/upsert/",
    method: HttpMethod.POST,
    TRes: Type<MetaArtifactRead[]>(),
    TBody:
      Type<
        UpsertRequest<MetaArtifactCreateRequest, MetaArtifactUpdateRequest>
      >(),
  },
} as const;
