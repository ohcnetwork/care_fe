import { HttpMethod, Type } from "@/Utils/request/types";
import { BatchRequestResponse } from "@/types/base/batch/batch";

import { BatchRequestBody } from "./batch";

/**
 * 400 Bad Request handler
 * @deprecated TODO: add a better error handler
 */

const batchApi = {
  batchRequest: {
    path: "/api/v1/batch_requests/",
    method: HttpMethod.POST,
    TRes: Type<BatchRequestResponse>(),
    TBody: Type<BatchRequestBody>(),
  },
} as const;

export default batchApi;
