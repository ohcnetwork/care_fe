import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { MedicationStatementRead } from "@/types/emr/medicationStatement";

const medicationStatementApi = {
  list: {
    path: "/api/v1/patient/{patientId}/medication/statement/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MedicationStatementRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
} as const;

export default medicationStatementApi;
