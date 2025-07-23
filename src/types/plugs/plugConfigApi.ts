import { Type } from "@/Utils/request/api";
import { PlugConfig } from "@/types/plugs/plugConfig";

export default {
  list: {
    path: "/api/v1/plug_config/",
    method: "GET",
    TRes: Type<{ configs: PlugConfig[] }>(),
  },
  get: {
    path: "/api/v1/plug_config/{slug}/",
    method: "GET",
    TRes: Type<PlugConfig>(),
  },
  create: {
    path: "/api/v1/plug_config/",
    method: "POST",
    TReq: Type<PlugConfig>(),
    TRes: Type<PlugConfig>(),
  },
  update: {
    path: "/api/v1/plug_config/{slug}/",
    method: "PATCH",
    TReq: Type<PlugConfig>(),
    TRes: Type<PlugConfig>(),
  },
  delete: {
    path: "/api/v1/plug_config/{slug}/",
    method: "DELETE",
    TRes: Type<Record<string, never>>(),
    TBody: Type<void>(),
  },
} as const;
