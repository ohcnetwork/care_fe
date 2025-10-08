import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";

export default {
  list: {
    path: "/api/v1/patient/{patientId}/medication/request/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MedicationRequestRead>>(),
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
