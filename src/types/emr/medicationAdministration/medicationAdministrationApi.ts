import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  MedicationAdministrationRead,
  MedicationAdministrationRequest,
} from "./medicationAdministration";

export default {
  listMedicationAdministrations: {
    path: "/api/v1/patient/{patientId}/medication/administration/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MedicationAdministrationRead>>(),
  },
  upsertMedicationAdministration: {
    path: "/api/v1/patient/{patientId}/medication/administration/upsert/",
    method: HttpMethod.POST,
    TRes: Type<MedicationAdministrationRequest[]>,
  },
};
