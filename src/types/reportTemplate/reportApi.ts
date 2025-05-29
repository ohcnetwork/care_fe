import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { ReportModel } from "./report";

export default {
  viewReports: {
    path: "/api/v1/report/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReportModel>>(),
  },
  retrieveReport: {
    path: "/api/v1/report/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ReportModel>(),
  },
  editReport: {
    path: "/api/v1/report/{id}/",
    method: HttpMethod.PUT,
    TBody: Type<Partial<ReportModel>>(),
    TRes: Type<ReportModel>(),
  },
  archiveReport: {
    path: "/api/v1/report/{id}/archive/",
    method: HttpMethod.POST,
    TRes: Type<ReportModel>(),
    TBody: Type<{ archive_reason: string }>(),
  },
  markReportCompleted: {
    path: "/api/v1/report/{id}/mark_upload_completed/",
    method: HttpMethod.POST,
    TRes: Type<ReportModel>(),
  },
};
