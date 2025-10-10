import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Diagnosis } from "./diagnosis";

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
};
