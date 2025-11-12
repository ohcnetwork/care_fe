import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  BaseTemplateRead,
  ReportArchiveRead,
  ReportCreate,
  ReportDownloadRead,
  ReportRead,
  TemplateCreate,
  TemplatePreviewCreate,
  TemplatePreviewRead,
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
    TRes: Type<BaseTemplateRead>(),
  },
  createTemplatePreview: {
    path: "/api/v1/template/preview/",
    method: HttpMethod.POST,
    TBody: Type<TemplatePreviewCreate>(),
    TRes: Type<TemplatePreviewRead>(),
  },
  listTemplates: {
    path: "/api/v1/template/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<BaseTemplateRead>>(),
  },
  retrieveTemplate: {
    path: "/api/v1/template/{template_id}/",
    method: HttpMethod.GET,
    TRes: Type<TemplateRead>(),
  },
  createReport: {
    path: "/api/v1/report/generate/",
    method: HttpMethod.POST,
    TBody: Type<ReportCreate>(),
  },
  listReports: {
    path: "/api/v1/report/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReportRead>>(),
    defaultQueryParams: {
      associating_id: "{encounter_id}",
      upload_completed: "true",
    },
  },
  downloadReport: {
    path: "/api/v1/report/{report_id}/download/",
    method: HttpMethod.GET,
    TRes: Type<ReportDownloadRead>(),
  },
  archiveReport: {
    path: "/api/v1/report/{report_id}/archive/",
    method: HttpMethod.POST,
    TBody: Type<{ archive_reason: string }>(),
    TRes: Type<ReportArchiveRead>(),
  },
};
