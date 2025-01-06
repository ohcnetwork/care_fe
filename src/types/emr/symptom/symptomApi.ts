import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Symptom } from "./symptom";

export default {
  listSymptoms: {
    path: "/api/v1/patient/{patientId}/symptom/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Symptom>>(),
  },
  retrieveSymptom: {
    path: "/api/v1/patient/{patientId}/symptom/{symptomId}/",
    method: HttpMethod.GET,
    TRes: Type<Symptom>(),
  },
};
