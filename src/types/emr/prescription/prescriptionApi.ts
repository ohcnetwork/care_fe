import {
  PrescriptionList,
  PrescriptionRead,
  PrescriptionSummary,
} from "@/types/emr/prescription/prescription";
import { TagUpdateRequest } from "@/types/emr/tagConfig/tagConfig";
import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

export default {
  list: {
    path: "/api/v1/patient/{patientId}/medication/prescription/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PrescriptionList>>(),
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
  upsert: {
    path: "/api/v1/patient/{patientId}/medication/prescription/upsert/",
    method: HttpMethod.POST,
    TRes: Type<PrescriptionRead>(),
  },
  setTags: {
    path: "/api/v1/patient/{patientId}/medication/prescription/{external_id}/set_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<TagUpdateRequest>(),
  },
  removeTags: {
    path: "/api/v1/patient/{patientId}/medication/prescription/{external_id}/remove_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<TagUpdateRequest>(),
  },
  summary: {
    path: "/api/v1/facility/{facilityId}/medication_prescription/summary/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PrescriptionSummary>>(),
  },
};
