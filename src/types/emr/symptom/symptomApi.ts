import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Symptom } from "./symptom";

const symptomApi = {
  listSymptoms: {
    path: "/api/v1/patient/{patientId}/symptom/",
    method: "GET",
    TRes: Type<PaginatedResponse<Symptom>>(),
  },
  retrieveSymptom: {
    path: "/api/v1/patient/{patientId}/symptom/{symptomId}/",
    method: "GET",
    TRes: Type<Symptom>(),
  },
} as const;

export default symptomApi;
