import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Diagnosis } from "./diagnosis";

const diagnosisApi = {
  listDiagnosis: {
    path: "/api/v1/patient/{patientId}/diagnosis/",
    method: "GET",
    TRes: Type<PaginatedResponse<Diagnosis>>(),
  },
  retrieveDiagnosis: {
    path: "/api/v1/patient/{patientId}/diagnosis/{diagnosisId}/",
    method: "GET",
    TRes: Type<Diagnosis>(),
  },
} as const;

export default diagnosisApi;
