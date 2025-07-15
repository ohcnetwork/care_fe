import { API, HttpMethod } from "@/Utils/request/api";
import { BatchSubmissionResult } from "@/types/questionnaire/batch";

import { BatchRequestBody } from "./batch";

const batchApi = {
  batchRequest: API<{ results: BatchSubmissionResult[] }, BatchRequestBody>(
    `${HttpMethod.POST} /api/v1/batch_requests/`,
  ),
};

export default batchApi;
