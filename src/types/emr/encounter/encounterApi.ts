import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  EncounterCreate,
  EncounterEdit,
  EncounterListRead,
  EncounterRead,
} from "@/types/emr/encounter/encounter";

export default {
  // Encounter CRUD Operations
  list: {
    path: "/api/v1/encounter/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<EncounterListRead>>(),
  },
  create: {
    path: "/api/v1/encounter/",
    method: HttpMethod.POST,
    TBody: Type<EncounterCreate>(),
    TRes: Type<EncounterRead>(),
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
  restart: {
    path: "/api/v1/encounter/{id}/restart/",
    method: HttpMethod.POST,
    TRes: Type<EncounterRead>(),
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
