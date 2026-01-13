import { HttpMethod, Type } from "@/Utils/request/types";
import { ExtensionRegistry } from "@/types/extensions/extensions";

export default {
  list: {
    path: "/api/v1/extensions/",
    method: HttpMethod.GET,
    TRes: Type<ExtensionRegistry>(),
  },
} as const;
