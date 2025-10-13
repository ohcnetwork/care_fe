import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { MedicationStatementRead } from "@/types/emr/medicationStatement";

const medicationStatementApi = {
  list: {
    path: "/api/v1/patient/{patientId}/medication/statement/",
    method: "GET",
    TRes: Type<PaginatedResponse<MedicationStatementRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
} as const;

export default medicationStatementApi;
