import {
  CreateFileRequest,
  CreateFileResponse,
  FileUploadModel,
} from "@/components/Patient/models";

import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

export default {
  create: {
    path: "/api/v1/files/",
    method: HttpMethod.POST,
    TBody: Type<CreateFileRequest>(),
    TRes: Type<CreateFileResponse>(),
  },
  list: {
    path: "/api/v1/files/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FileUploadModel>>(),
  },
  get: {
    path: "/api/v1/files/{id}/",
    method: HttpMethod.GET,
    TRes: Type<FileUploadModel>(),
  },
  update: {
    path: "/api/v1/files/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<Partial<FileUploadModel>>(),
    TRes: Type<FileUploadModel>(),
  },
  markAsCompleted: {
    path: "/api/v1/files/{id}/mark_upload_completed/",
    method: HttpMethod.POST,
    TRes: Type<FileUploadModel>(),
  },
  archive: {
    path: "/api/v1/files/{id}/archive/",
    method: HttpMethod.POST,
    TRes: Type<FileUploadModel>(),
    TBody: Type<{ archive_reason: string }>(),
  },
};
