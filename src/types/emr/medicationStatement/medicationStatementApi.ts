import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { MedicationStatement } from "../medicationStatement";

const medicationStatementApi = {
  list: {
    path: "/api/v1/patient/{patientId}/medication/statement/",
    method: "GET",
    TRes: Type<PaginatedResponse<MedicationStatement>>(),
  },
} as const;

export default medicationStatementApi;
