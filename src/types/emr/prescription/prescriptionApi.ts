import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  PrescriptionRead,
  PrescriptionSummary,
  PrescritionList,
} from "@/types/emr/prescription/prescription";

export default {
  list: {
    path: "/api/v1/patient/{patientId}/medication/prescription/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PrescritionList>>(),
  },
  get: {
    path: "/api/v1/patient/{patientId}/medication/prescription/{id}/",
    method: HttpMethod.GET,
    TRes: Type<PrescriptionRead>(),
  },
  update: {
    path: "/api/v1/patient/{patientId}/medication/prescription/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<PrescriptionRead>(),
  },
  summary: {
    path: "/api/v1/facility/{facilityId}/medication_prescription/summary/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PrescriptionSummary>>(),
  },
};
