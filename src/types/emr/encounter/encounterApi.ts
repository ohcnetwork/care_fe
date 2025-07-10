import { HttpMethod, Type } from "@/Utils/request/api";

import { Encounter } from "./encounter";

export default {
  getEncounter: {
    path: "/api/v1/encounter/{id}/",
    method: HttpMethod.GET,
    TBody: Type<Encounter>(),
    TRes: Type<Encounter>(),
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
};
