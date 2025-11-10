import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Symptom, SymptomRequest } from "./symptom";

export default {
  listSymptoms: {
    path: "/api/v1/patient/{patientId}/symptom/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Symptom>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveSymptom: {
    path: "/api/v1/patient/{patientId}/symptom/{symptomId}/",
    method: HttpMethod.GET,
    TRes: Type<Symptom>(),
  },
  upsertSymptoms: {
    path: "/api/v1/patient/{patientId}/symptom/upsert/",
    method: HttpMethod.POST,
    TRes: Type<Symptom[]>(),
    TBody: Type<{ datapoints: SymptomRequest[] }>(),
  },
};
