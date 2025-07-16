import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  Observation,
  ObservationAnalyzeResponse,
} from "@/types/emr/observation";

import {
  ObservationCreate,
  ObservationFromDefinitionCreate,
  ObservationUpdate,
} from "./observation";

export default {
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

export const ObservationRoutes = {
  listObservations: {
    path: "/api/v1/patient/{patientId}/observation/",
    method: "GET",
    TRes: Type<PaginatedResponse<Observation>>(),
  },
  observationsAnalyse: {
    path: "/api/v1/patient/{patientId}/observation/analyse/",
    method: "POST",
    TRes: Type<ObservationAnalyzeResponse>(),
  },
} as const;
