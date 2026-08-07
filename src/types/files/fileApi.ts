import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { FileRead, FileReadMinimal, FileUpdate } from "@/types/files/file";

export default {
  /**
   * Uploads a file through CARE as `multipart/form-data`.
   *
   * The body carries the binary `file` part plus `name`, `associating_id`,
   * `file_type` and `file_category`. CARE streams the bytes to storage, so the
   * client never talks to an object-storage provider.
   */
  upload: {
    path: "/api/v1/files/upload-file/",
    method: HttpMethod.POST,
    TBody: Type<FormData>(),
    TRes: Type<FileRead>(),
  },
  list: {
    path: "/api/v1/files/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FileReadMinimal>>(),
    defaultQueryParams: {
      ordering: "-modified_date",
    },
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
  archive: {
    path: "/api/v1/files/{fileId}/archive/",
    method: HttpMethod.POST,
    TBody: Type<{ archive_reason: string }>(),
    TRes: Type<FileReadMinimal>(),
  },
};
