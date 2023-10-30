import { Type } from "../../Redux/api";
import { PaginatedResponse } from "../../Utils/request/types";
import { ConsultationDiagnosis, CreateDiagnosis } from "./types";

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
    TBody: Type<CreateDiagnosis>(),
  },

  getConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/{id}/",
    TRes: Type<ConsultationDiagnosis>(),
  },

  updateConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/{id}/",
    method: "PATCH",
    TBody: Type<Pick<CreateDiagnosis, "verification_status">>(),
    TRes: Type<ConsultationDiagnosis>(),
  },

  toggleIsPrincipalConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/{id}/toggle_is_principal/",
    method: "POST",
    TRes: Type<Pick<ConsultationDiagnosis, "is_principal">>(),
  },
};

export default DiagnosesRoutes;
