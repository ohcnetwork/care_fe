import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  MedicationDispenseCreate,
  MedicationDispenseRead,
  MedicationDispenseSummary,
  MedicationDispenseUpdate,
  MedicationDispenseUpsert,
} from "@/types/emr/medicationDispense/medicationDispense";

export default {
  create: {
    path: "/api/v1/medication/dispense/",
    method: HttpMethod.POST,
    TRes: Type<MedicationDispenseRead>(),
    TBody: Type<MedicationDispenseCreate>(),
  },
  list: {
    path: "/api/v1/medication/dispense/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MedicationDispenseRead>>(),
  },
  upsert: {
    path: "/api/v1/medication/dispense/upsert/",
    method: HttpMethod.POST,
    TRes: Type<MedicationDispenseRead>(),
    TBody: Type<{ datapoints: MedicationDispenseUpsert[] }>(),
  },
  summary: {
    path: "/api/v1/medication/dispense/summary/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MedicationDispenseSummary>>(),
  },
  update: {
    path: "/api/v1/medication/dispense/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<MedicationDispenseRead>(),
    TBody: Type<MedicationDispenseUpdate>(),
  },
};
