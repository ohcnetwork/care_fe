import {
  BatchRequestBody,
  BatchRequestResponse,
} from "@/types/base/batch/batch";
import { callApi } from "@/Utils/request/query";
import { ApiRoute, HttpMethod, Type } from "@/Utils/request/types";
import { makeUrl } from "@/Utils/request/utils";
import {
  DefaultError,
  QueryClient,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";

export const batchRequestRoute = {
  path: "/api/v1/batch_requests/",
  method: HttpMethod.POST,
  TRes: Type<BatchRequestResponse>(),
  TBody: Type<BatchRequestBody>(),
} as const;

export interface BatchRequestObject<T = unknown> {
  api: ApiRoute<unknown, unknown>;
  pathParams?: Record<string, string>;
  body: T;
  referenceId: string;
}

/**
 * Maps an array of {@link BatchRequestObject}s to the body expected by the
 * batch request endpoint.
 */
export function buildBatchRequestBody(
  requests: BatchRequestObject[],
): BatchRequestBody {
  return {
    requests: requests.map((request) => ({
      url: makeUrl(request.api.path, undefined, request.pathParams),
      method: request.api.method ?? HttpMethod.GET,
      reference_id: request.referenceId,
      body: request.body,
    })),
  };
}

/**
 * Type guard that narrows an {@link HTTPError} cause to a batch request
 * response (an object with a `results` array of per-sub-request results).
 */
export function isBatchResult(cause: unknown): cause is BatchRequestResponse {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "results" in cause &&
    Array.isArray((cause as BatchRequestResponse).results) &&
    (cause as BatchRequestResponse).results.every(
      (result) =>
        typeof result === "object" &&
        result !== null &&
        "reference_id" in result &&
        "status_code" in result,
    )
  );
}

export function useBatchRequest<TError = DefaultError, TContext = unknown>(
  options: UseMutationOptions<
    BatchRequestResponse,
    TError,
    BatchRequestObject[],
    TContext
  >,
  queryClient?: QueryClient,
) {
  const mutation = useMutation(
    {
      mutationFn: (requests: BatchRequestObject[]) =>
        callApi(batchRequestRoute, {
          body: buildBatchRequestBody(requests),
        }),
      ...options,
    },
    queryClient,
  );

  return {
    ...mutation,
  };
}
