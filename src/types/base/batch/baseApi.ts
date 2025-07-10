import { Type } from "@/Utils/request/api";
import { BatchRequestBody } from "@/types/base/batch/batch";
import { BatchSubmissionResult } from "@/types/questionnaire/batch";

export default {
  batchRequest: {
    path: "/api/v1/batch_requests/",
    method: "POST",
    TRes: Type<{
      results: BatchSubmissionResult[];
    }>(),
    TBody: Type<BatchRequestBody>(),
  },
};
