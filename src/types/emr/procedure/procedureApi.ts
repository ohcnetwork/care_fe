import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import { Procedure, ProcedureRequest } from "./procedure";

export default {
  listProcedures: {
    path: "/api/v1/patient/{patientId}/procedure/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Procedure>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  retrieveProcedure: {
    path: "/api/v1/patient/{patientId}/procedure/{procedureId}/",
    method: HttpMethod.GET,
    TRes: Type<Procedure>(),
  },
  upsertProcedures: {
    path: "/api/v1/patient/{patientId}/procedure/upsert/",
    method: HttpMethod.POST,
    TRes: Type<Procedure[]>(),
    TBody: Type<{ datapoints: ProcedureRequest[] }>(),
  },
};
