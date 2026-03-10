import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";

export default {
  list: {
    path: "/api/v1/patient/{patientId}/medication/request/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MedicationRequestRead>>(),
    TQuery: Type<{
      encounter?: string;
      prescription?: string;
      product_type?: string;
      medications_only?: boolean;
    }>(),
    defaultQueryParams: {
      ordering: "-created_date",
    },
  },
  upsert: {
    path: "/api/v1/patient/{patientId}/medication/request/upsert/",
    method: HttpMethod.POST,
    TRes: Type<MedicationRequestRead[]>,
  },
  update: {
    path: "/api/v1/patient/{patientId}/medication/request/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<MedicationRequestRead>,
  },
};
