import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import { ReportGenerateCreate, ReportRead, ReportReadList } from "./report";

export default {
  createReport: {
    path: "/api/v1/template_reports/generate/",
    method: HttpMethod.POST,
    TBody: Type<ReportGenerateCreate>(),
    TRes: Type<{ status: string; detail?: string }>(),
  },
  retrieveReport: {
    path: "/api/v1/template_reports/{id}/",
    method: HttpMethod.GET,
    TRes: Type<ReportRead>(),
  },
  listReports: {
    path: "/api/v1/template_reports/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReportReadList>>(),
    defaultQueryParams: {
      associating_id: "{encounter_id}",
      upload_completed: "true",
    },
  },
  archiveReport: {
    path: "/api/v1/template_reports/{id}/archive/",
    method: HttpMethod.POST,
    TBody: Type<{ archive_reason: string }>(),
    TRes: Type<ReportReadList>(),
  },
};
