import { HttpMethod, Type } from "@/Utils/request/api";

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
