import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  AllergyIntolerance,
  AllergyIntoleranceRequest,
} from "./allergyIntolerance";

export default {
  getAllergy: {
    path: "/api/v1/patient/{patientId}/allergy_intolerance/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<AllergyIntolerance>>(),
  },
  retrieveAllergy: {
    path: "/api/v1/patient/{patientId}/allergy_intolerance/{allergyId}/",
    method: HttpMethod.GET,
    TRes: Type<AllergyIntolerance>(),
  },
  upsertAllergy: {
    path: "/api/v1/patient/{patientId}/allergy_intolerance/upsert/",
    method: HttpMethod.POST,
    TRes: Type<AllergyIntolerance[]>(),
    TBody: Type<{ datapoints: AllergyIntoleranceRequest[] }>(),
  },
};
