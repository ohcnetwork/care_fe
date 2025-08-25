import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  FileCreate,
  FileRead,
  FileReadMinimal,
  FileUpdate,
} from "@/types/files/file";

export default {
  create: {
    path: "/api/v1/files/",
    method: HttpMethod.POST,
    TBody: Type<FileCreate>(),
    TRes: Type<FileRead>(),
  },
  list: {
    path: "/api/v1/files/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FileReadMinimal>>(),
  },
  get: {
    path: "/api/v1/files/{fileId}/",
    method: HttpMethod.GET,
    TRes: Type<FileRead>(),
  },
  update: {
    path: "/api/v1/files/{fileId}/",
    method: HttpMethod.PUT,
    TBody: Type<FileUpdate>(),
    TRes: Type<FileRead>(),
  },
  markUploadCompleted: {
    path: "/api/v1/files/{fileId}/mark_upload_completed/",
    method: HttpMethod.POST,
    TRes: Type<FileReadMinimal>(),
    TBody: Type<void>(),
  },
  archive: {
    path: "/api/v1/files/{fileId}/archive/",
    method: HttpMethod.POST,
    TBody: Type<{ archive_reason: string }>(),
    TRes: Type<FileReadMinimal>(),
  },
};
