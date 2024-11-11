import {
  MedicineAdministrationRecord,
  Prescription,
} from "@/components/Medicine/models";

import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

const MedicineRoutes = {
  listPrescriptions: {
    path: "/api/v1/consultation/{consultation}/prescriptions/",
    method: "GET",
    TRes: Type<PaginatedResponse<Prescription>>(),
  },

  createPrescription: {
    path: "/api/v1/consultation/{consultation}/prescriptions/",
    method: "POST",
    TBody: Type<Prescription>(),
    TRes: Type<Prescription>(),
  },

  listAdministrations: {
    path: "/api/v1/consultation/{consultation}/prescription_administration/",
    method: "GET",
    TRes: Type<PaginatedResponse<MedicineAdministrationRecord>>(),
  },

  getAdministration: {
    path: "/api/v1/consultation/{consultation}/prescription_administration/{external_id}/",
    method: "GET",
    TRes: Type<MedicineAdministrationRecord>(),
  },

  getPrescription: {
    path: "/api/v1/consultation/{consultation}/prescriptions/{external_id}/",
    method: "GET",
    TRes: Type<Prescription>(),
  },

  administerPrescription: {
    path: "/api/v1/consultation/{consultation}/prescriptions/{external_id}/administer/",
    method: "POST",
    TBody: Type<Partial<MedicineAdministrationRecord>>(),
    TRes: Type<MedicineAdministrationRecord>(),
  },

  discontinuePrescription: {
    path: "/api/v1/consultation/{consultation}/prescriptions/{external_id}/discontinue/",
    method: "POST",
    TBody: Type<{ discontinued_reason: string }>(),
    TRes: Type<Record<string, never>>(),
  },

  archiveAdministration: {
    path: "/api/v1/consultation/{consultation}/prescription_administration/{external_id}/archive/",
    method: "POST",
    TBody: Type<Record<string, never>>(),
    TRes: Type<Record<string, never>>(),
  },
} as const;

export default MedicineRoutes;
