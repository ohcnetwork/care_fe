import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { AllergyIntolerance } from "./allergyIntolerance";

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
};
