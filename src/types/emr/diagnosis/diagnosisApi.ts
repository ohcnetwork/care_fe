import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import { Diagnosis, DiagnosisRequest } from "./diagnosis";

export default {
  listDiagnosis: {
    path: "/api/v1/patient/{patientId}/diagnosis/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Diagnosis>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveDiagnosis: {
    path: "/api/v1/patient/{patientId}/diagnosis/{diagnosisId}/",
    method: HttpMethod.GET,
    TRes: Type<Diagnosis>(),
  },
  upsertDiagnosis: {
    path: "/api/v1/patient/{patientId}/diagnosis/upsert/",
    method: HttpMethod.POST,
    TRes: Type<Diagnosis[]>(),
    TBody: Type<{ datapoints: DiagnosisRequest[] }>(),
  },
};
