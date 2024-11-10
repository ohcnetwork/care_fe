import {
  ConsultationDiagnosis,
  CreateDiagnosis,
} from "@/components/Diagnosis/types";

import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

const DiagnosesRoutes = {
  // ICD-11
  searchICD11Diagnoses: {
    path: "/api/v1/icd/",
  },

  // Consultation Diagnoses
  listConsultationDiagnoses: {
    path: "/api/v1/consultation/{consultation}/diagnoses/",
    TRes: Type<PaginatedResponse<ConsultationDiagnosis>>(),
  },

  createConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/",
    method: "POST",
    TBody: Type<CreateDiagnosis>(),
    TRes: Type<ConsultationDiagnosis>(),
  },

  getConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/{id}/",
    TRes: Type<ConsultationDiagnosis>(),
  },

  updateConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/{id}/",
    method: "PATCH",
    TBody: Type<Partial<ConsultationDiagnosis>>(),
    TRes: Type<ConsultationDiagnosis>(),
  },
} as const;

export default DiagnosesRoutes;
