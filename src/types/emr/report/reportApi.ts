import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  ReportArchiveRead,
  ReportDownloadRead,
  ReportGenerateCreate,
  ReportGenerateRead,
  ReportRead,
  ReportReadList,
  ReportTypeRead,
  ReportUpdate,
} from "./report";

export default {
  createReport: {
    path: "/api/v1/report/generate/",
    method: HttpMethod.POST,
    TBody: Type<ReportGenerateCreate>(),
    TRes: Type<ReportGenerateRead>(),
  },
  updateReport: {
    path: "/api/v1/report/{report_id}/",
    method: HttpMethod.PUT,
    TBody: Type<ReportUpdate>(),
    TRes: Type<ReportRead>(),
  },
  listReports: {
    path: "/api/v1/report/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReportReadList>>(),
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
  getReportTypes: {
    path: "/api/v1/report/get_report_types/",
    method: HttpMethod.GET,
    TRes: Type<ReportTypeRead>(),
  },
};
