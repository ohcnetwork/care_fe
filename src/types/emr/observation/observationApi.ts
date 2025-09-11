import { HttpMethod, Type } from "@/Utils/request/api";

import { PaginatedResponse } from "@/Utils/request/types";
import {
  ObservationAnalyzeResponse,
  ObservationCreate,
  ObservationFromDefinitionCreate,
  ObservationListRead,
  ObservationUpdate,
} from "./observation";

export default {
  analyse: {
    path: "/api/v1/patient/{patientId}/observation/analyse/",
    method: HttpMethod.POST,
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
    TRes: Type<void>(),
    TBody: Type<{
      observations:
        | ObservationCreate[]
        | ObservationFromDefinitionCreate[]
        | ObservationUpdate[];
    }>(),
  },
} as const;
