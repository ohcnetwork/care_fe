import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { AllergyIntolerance } from "./allergyIntolerance";

const allergyIntoleranceApi = {
  getAllergy: {
    path: "/api/v1/patient/{patientId}/allergy_intolerance/",
    method: "GET",
    TRes: Type<PaginatedResponse<AllergyIntolerance>>(),
  },
  retrieveAllergy: {
    path: "/api/v1/patient/{patientId}/allergy_intolerance/{allergyId}/",
    method: "GET",
    TRes: Type<AllergyIntolerance>(),
  },
} as const;

export default allergyIntoleranceApi;
