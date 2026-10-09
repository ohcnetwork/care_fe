import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import {
  PrescriptionList,
  PrescriptionRead,
} from "@/types/emr/prescription/prescription";

export default {
  listPrescriptions: {
    path: "/api/v1/otp/medication_prescription/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PrescriptionList>>(),
  },
  getPrescription: {
    path: "/api/v1/otp/medication_prescription/{id}/",
    method: HttpMethod.GET,
    TRes: Type<PrescriptionRead>(),
  },
  listDiagnosticReports: {
    path: "/api/v1/otp/diagnostic_report/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DiagnosticReportRead>>(),
  },
  getDiagnosticReport: {
    path: "/api/v1/otp/diagnostic_report/{id}/",
    method: HttpMethod.GET,
    TRes: Type<DiagnosticReportRead>(),
  },
} as const;
