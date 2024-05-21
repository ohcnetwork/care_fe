import { Type } from "../../Redux/api";
import { PaginatedResponse } from "../../Utils/request/types";
import { WritableOnly } from "../../Utils/types";
import { ConsultationSymptom } from "./types";

const SymptomsApi = {
  list: {
    method: "GET",
    path: "/api/v1/consultation/{consultationId}/symptoms/",
    TRes: Type<PaginatedResponse<ConsultationSymptom>>(),
  },

  add: {
    path: "/api/v1/consultation/{consultationId}/symptoms/",
    method: "POST",
    TRes: Type<ConsultationSymptom>(),
    TBody: Type<WritableOnly<ConsultationSymptom>>(),
  },

  retrieve: {
    method: "GET",
    path: "/api/v1/consultation/{consultationId}/symptoms/{external_id}/",
    TRes: Type<ConsultationSymptom>(),
  },

  update: {
    method: "PUT",
    path: "/api/v1/consultation/{consultationId}/symptoms/{external_id}/",
    TBody: Type<WritableOnly<ConsultationSymptom>>(),
    TRes: Type<ConsultationSymptom>(),
  },

  partialUpdate: {
    method: "PATCH",
    path: "/api/v1/consultation/{consultationId}/symptoms/{external_id}/",
    TBody: Type<Partial<WritableOnly<ConsultationSymptom>>>(),
    TRes: Type<ConsultationSymptom>(),
  },

  markAsEnteredInError: {
    method: "DELETE",
    path: "/api/v1/consultation/{consultationId}/symptoms/{external_id}/",
    TRes: Type<unknown>(),
  },
} as const;

export default SymptomsApi;
