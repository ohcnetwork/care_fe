import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

const medicationRequestApi = {
  // Medication
  list: {
    path: "/api/v1/patient/{patientId}/medication/request/",
    method: "GET",
    TRes: Type<PaginatedResponse<MedicationRequestRead>>(),
  },
} as const;

export default medicationRequestApi;
