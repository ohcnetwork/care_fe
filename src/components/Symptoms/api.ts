import { EncounterSymptom } from "@/components/Symptoms/types";

import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { WritableOnly } from "@/Utils/types";

const SymptomsApi = {
  list: {
    method: "GET",
    path: "/api/v1/consultation/{consultationId}/symptoms/",
    TRes: Type<PaginatedResponse<EncounterSymptom>>(),
  },

  add: {
    path: "/api/v1/consultation/{consultationId}/symptoms/",
    method: "POST",
    TRes: Type<EncounterSymptom>(),
    TBody: Type<WritableOnly<EncounterSymptom>>(),
  },

  retrieve: {
    method: "GET",
    path: "/api/v1/consultation/{consultationId}/symptoms/{external_id}/",
    TRes: Type<EncounterSymptom>(),
  },

  update: {
    method: "PUT",
    path: "/api/v1/consultation/{consultationId}/symptoms/{external_id}/",
    TBody: Type<WritableOnly<EncounterSymptom>>(),
    TRes: Type<EncounterSymptom>(),
  },

  partialUpdate: {
    method: "PATCH",
    path: "/api/v1/consultation/{consultationId}/symptoms/{external_id}/",
    TBody: Type<Partial<WritableOnly<EncounterSymptom>>>(),
    TRes: Type<EncounterSymptom>(),
  },

  markAsEnteredInError: {
    method: "DELETE",
    path: "/api/v1/consultation/{consultationId}/symptoms/{external_id}/",
    TRes: Type<unknown>(),
  },
} as const;

export default SymptomsApi;
