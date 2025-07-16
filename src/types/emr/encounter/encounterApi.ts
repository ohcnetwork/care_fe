import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Encounter, EncounterCreate, EncounterEdit } from "./encounter";

export default {
  // Encounter CRUD Operations
  list: {
    path: "/api/v1/encounter/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Encounter>>(),
  },
  create: {
    path: "/api/v1/encounter/",
    method: HttpMethod.POST,
    TRes: Type<Encounter>(),
    TBody: Type<EncounterCreate>(),
  },
  get: {
    path: "/api/v1/encounter/{id}/",
    method: HttpMethod.GET,
    TRes: Type<Encounter>(),
  },
  update: {
    path: "/api/v1/encounter/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<Encounter>(),
    TBody: Type<EncounterEdit>(),
  },

  // Organization Management
  addOrganization: {
    path: "/api/v1/encounter/{encounterId}/organizations_add/",
    method: HttpMethod.POST,
    TRes: Type<Encounter>(),
    TBody: Type<{ organization: string }>(),
  },
  removeOrganization: {
    path: "/api/v1/encounter/{encounterId}/organizations_remove/",
    method: HttpMethod.DELETE,
    TRes: Type<Encounter>(),
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
