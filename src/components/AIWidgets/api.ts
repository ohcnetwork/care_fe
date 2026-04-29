import { HttpMethod, Type } from "@/Utils/request/types";

import { AskRequest, AskResponse } from "@/components/AIWidgets/types";

const aiWidgetsApi = {
  ask: {
    path: "/api/care_ai/encounter/{encounterId}/ask/",
    method: HttpMethod.POST,
    TRes: Type<AskResponse>(),
    TBody: Type<AskRequest>(),
  },
} as const;

export default aiWidgetsApi;
