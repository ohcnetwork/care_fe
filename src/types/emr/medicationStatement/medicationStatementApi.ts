import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  MedicationStatementRead,
  MedicationStatementRequest,
} from "@/types/emr/medicationStatement";

const medicationStatementApi = {
  list: {
    path: "/api/v1/patient/{patientId}/medication/statement/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MedicationStatementRead>>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  upsert: {
    path: "/api/v1/patient/{patientId}/medication/statement/upsert/",
    method: HttpMethod.POST,
    TRes: Type<MedicationStatementRead[]>(),
    TBody: Type<{ datapoints: MedicationStatementRequest[] }>(),
  },
} as const;

export default medicationStatementApi;
