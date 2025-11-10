import { HttpMethod, Type } from "@/Utils/request/api";
import { BatchRequestResponse } from "@/types/base/batch/batch";

import { BatchRequestBody } from "./batch";

const batchApi = {
  batchRequest: {
    path: "/api/v1/batch_requests/",
    method: HttpMethod.POST,
    TRes: Type<BatchRequestResponse>(),
    TBody: Type<BatchRequestBody>(),
  },
} as const;

export default batchApi;
