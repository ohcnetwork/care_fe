import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  PatientIdentifierConfig,
  PatientIdentifierConfigCreate,
  PatientIdentifierConfigUpdate,
} from "./patientIdentifierConfig";

export default {
  listPatientIdentifierConfig: {
    path: "/api/v1/patient_identifier_config/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PatientIdentifierConfig>>(),
  },
  retrievePatientIdentifierConfig: {
    path: "/api/v1/patient_identifier_config/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<PatientIdentifierConfig>(),
  },
  createPatientIdentifierConfig: {
    path: "/api/v1/patient_identifier_config/",
    method: HttpMethod.POST,
    TRes: Type<PatientIdentifierConfig>(),
    TBody: Type<PatientIdentifierConfigCreate>(),
  },
  updatePatientIdentifierConfig: {
    path: "/api/v1/patient_identifier_config/{external_id}/",
    method: HttpMethod.PUT,
    TRes: Type<PatientIdentifierConfig>(),
    TBody: Type<PatientIdentifierConfigUpdate>(),
  },
  updatePatientIdentifier: {
    path: "/api/v1/patient/{external_id}/update_identifier/",
    method: HttpMethod.POST,
    TRes: Type<void>(),
    TBody: Type<{
      config: string;
      value: string;
    }>(),
  },
} as const;
