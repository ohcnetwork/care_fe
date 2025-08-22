import { HttpMethod, Type } from "@/Utils/request/api";
import { BatchSubmissionResult } from "@/types/questionnaire/batch";

import { BatchRequestBody } from "./batch";

const batchApi = {
  batchRequest: {
    path: "/api/v1/batch_requests/",
    method: HttpMethod.POST,
    TRes: Type<{ results: BatchSubmissionResult[] }>(),
    TBody: Type<BatchRequestBody>(),
  },
} as const;

export default batchApi;
