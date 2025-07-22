import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { EncounterCreate, EncounterEdit, EncounterRead } from "./encounter";

export default {
  // Encounter CRUD Operations
  list: {
    path: "/api/v1/encounter/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<EncounterRead>>(),
  },
  create: {
    path: "/api/v1/encounter/",
    method: HttpMethod.POST,
    TRes: Type<EncounterRead>(),
    TBody: Type<EncounterCreate>(),
  },
  get: {
    path: "/api/v1/encounter/{id}/",
    method: HttpMethod.GET,
    TRes: Type<EncounterRead>(),
  },
  update: {
    path: "/api/v1/encounter/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<EncounterRead>(),
    TBody: Type<EncounterEdit>(),
  },

  // Organization Management
  addOrganization: {
    path: "/api/v1/encounter/{encounterId}/organizations_add/",
    method: HttpMethod.POST,
    TRes: Type<EncounterRead>(),
    TBody: Type<{ organization: string }>(),
  },
  removeOrganization: {
    path: "/api/v1/encounter/{encounterId}/organizations_remove/",
    method: HttpMethod.DELETE,
    TRes: Type<EncounterRead>(),
    TBody: Type<{ organization: string }>(),
  },

  // Discharge Summary
  generateDischargeSummary: {
    path: "/api/v1/encounter/{encounterId}/generate_discharge_summary/",
    method: HttpMethod.POST,
    TRes: Type<{ detail: string }>(),
  },

  // Tag-related endpoints
  setTags: {
    path: "/api/v1/encounter/{external_id}/set_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<{ tags: string[] }>(),
  },
  removeTags: {
    path: "/api/v1/encounter/{external_id}/remove_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<{ tags: string[] }>(),
  },
} as const;
