import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  ObservationAnalyzeRequest,
  ObservationAnalyzeResponse,
  ObservationBatchUpsertRequest,
  ObservationBatchUpsertResponse,
  ObservationListRead,
} from "./observation";

export default {
  analyse: {
    path: "/api/v1/patient/{patientId}/observation/analyse/",
    method: HttpMethod.POST,
    TBody: Type<ObservationAnalyzeRequest>(),
    TRes: Type<ObservationAnalyzeResponse>(),
  },
  list: {
    path: "/api/v1/patient/{patientId}/observation/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ObservationListRead>>(),
  },
  upsertObservations: {
    path: "/api/v1/patient/{patient_external_id}/diagnostic_report/{external_id}/upsert_observations/",
    method: HttpMethod.POST,
    TBody: Type<ObservationBatchUpsertRequest>(),
    TRes: Type<ObservationBatchUpsertResponse>(),
  },
} as const;
