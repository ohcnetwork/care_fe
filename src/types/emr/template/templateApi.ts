import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  TemplateBaseRead,
  TemplateCreate,
  TemplatePreviewCreate,
  TemplateRead,
  TemplateSchemaRead,
} from "./template";

export default {
  retrieveSchema: {
    path: "/api/v1/template/schema/",
    method: HttpMethod.GET,
    TRes: Type<TemplateSchemaRead>(),
  },
  createTemplate: {
    path: "/api/v1/template/",
    method: HttpMethod.POST,
    TBody: Type<TemplateCreate>(),
    TRes: Type<TemplateRead>(),
  },
  updateTemplate: {
    path: "/api/v1/template/{slug}/",
    method: HttpMethod.PUT,
    TBody: Type<TemplateCreate>(),
    TRes: Type<TemplateRead>(),
  },
  createTemplatePreview: {
    path: "/api/v1/template/preview/",
    method: HttpMethod.POST,
    TBody: Type<TemplatePreviewCreate>(),
    TRes: Type<Blob>(),
  },
  listTemplates: {
    path: "/api/v1/template/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<TemplateBaseRead>>(),
  },
  retrieveTemplate: {
    path: "/api/v1/template/{slug}/",
    method: HttpMethod.GET,
    TRes: Type<TemplateRead>(),
  },
};
