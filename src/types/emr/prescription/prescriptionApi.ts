import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";

export default {
  list: {
    path: "/api/v1/patient/{patientId}/medication/prescription/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PrescriptionRead>>(),
  },
  get: {
    path: "/api/v1/patient/{patientId}/medication/prescription/{id}/",
    method: HttpMethod.GET,
    TRes: Type<PrescriptionRead>(),
  },
};
