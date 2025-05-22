import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  ReportTemplateCreate,
  ReportTemplateGenerate,
  ReportTemplateModel,
  ReportTemplateUpdate,
} from "./reportTemplate";

export default {
  list: {
    path: "/api/v1/report_template/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReportTemplateModel>>(),
  },
  create: {
    path: "/api/v1/report_template/",
    method: HttpMethod.POST,
    TBody: Type<ReportTemplateCreate>(),
    TRes: Type<ReportTemplateModel>(),
  },
  get: {
    path: "/api/v1/report_template/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ReportTemplateModel>(),
  },
  update: {
    path: "/api/v1/report_template/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<ReportTemplateUpdate>(),
    TRes: Type<ReportTemplateModel>(),
  },
  delete: {
    path: "/api/v1/report_template/{id}/",
    method: HttpMethod.DELETE,
  },
  getAvailableSections: {
    path: "/api/v1/report_template/get_available_section_source/",
    method: HttpMethod.GET,
    TRes: Type<Record<string, string[]>>(),
  },
  generateReport: {
    path: "/api/v1/report_template/display_report/",
    method: HttpMethod.POST,
    TBody: Type<ReportTemplateGenerate>(),
    TRes: Type<string[]>(),
  },
} as const;
