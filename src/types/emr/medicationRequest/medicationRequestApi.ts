import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { MedicationRequest } from "../medicationRequest";

const medicationRequestApi = {
  // Medication
  list: {
    path: "/api/v1/patient/{patientId}/medication/request/",
    method: "GET",
    TRes: Type<PaginatedResponse<MedicationRequest>>(),
  },
} as const;

export default medicationRequestApi;
