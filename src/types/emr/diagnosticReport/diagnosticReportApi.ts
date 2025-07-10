import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  DiagnosticReportCreate,
  DiagnosticReportRead,
  DiagnosticReportUpdate,
} from "./diagnosticReport";

export default {
  listDiagnosticReports: {
    path: "/api/v1/patient/{patient_external_id}/diagnostic_report/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DiagnosticReportRead>>(),
  },

  createDiagnosticReport: {
    path: "/api/v1/patient/{patient_external_id}/diagnostic_report/",
    method: HttpMethod.POST,
    TRes: Type<DiagnosticReportRead>(), // Response seems similar to Read
    TBody: Type<DiagnosticReportCreate>(),
  },

  retrieveDiagnosticReport: {
    path: "/api/v1/patient/{patient_external_id}/diagnostic_report/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<DiagnosticReportRead>(),
  },

  updateDiagnosticReport: {
    path: "/api/v1/patient/{patient_external_id}/diagnostic_report/{external_id}/",
    method: HttpMethod.PUT,
    TRes: Type<DiagnosticReportRead>(),
    TBody: Type<DiagnosticReportUpdate>(),
  },
};
