import {
  BatchRequestBody,
  BatchRequestResponse,
  BatchRequestResult,
} from "@/types/base/batch/batch";
import { handleHttpError } from "@/Utils/request/errorHandler";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { ApiRoute, HTTPError, HttpMethod, Type } from "@/Utils/request/types";
import { makeUrl } from "@/Utils/request/utils";
import {
  DefaultError,
  QueryClient,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";

export interface BatchRequestObject<T = unknown> {
  api: ApiRoute<unknown, unknown>;
  pathParams?: Record<string, string>;
  body: T;
  referenceId: string;
}

export interface BatchQueryObject {
  api: ApiRoute<unknown, unknown>;
  pathParams?: Record<string, string>;
  referenceId: string;
}

const batchRequestApi = {
  path: "/api/v1/batch_requests/",
  method: HttpMethod.POST,
  TRes: Type<BatchRequestResponse>(),
  TBody: Type<BatchRequestBody>(),
} as const;

/**
 * Maps an array of {@link BatchRequestObject}s to the body expected by the
 * batch request endpoint.
 */
function buildBatchRequestBody(
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
 * Tells if the error cause is a batch response.
 *
 * The backend runs the batch in one atomic transaction. If one sub-request
 * fails, the backend gives a 4xx/5xx status for the full batch, but it keeps
 * the status and error body of each sub-request in the `results` array. Use
 * this guard to find that shape.
 */
function isBatchResponse(cause: unknown): cause is BatchRequestResponse {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "results" in cause &&
    Array.isArray(cause.results) &&
    cause.results.every((result) => {
      if (typeof result !== "object" || result === null) {
        return false;
      }
      const r = result as Record<string, unknown>;
      return (
        typeof r.reference_id === "string" && typeof r.status_code === "number"
      );
    })
  );
}

/**
 * Sends the error of each failed sub-request to the global error handler.
 *
 * The global error handler cannot read the batch shape. So it shows a wrong
 * "something went wrong" message for the successful sub-requests too. To
 * prevent this, make a new `HTTPError` for each failed sub-request and give
 * it to the global error handler. Each sub-error gets the full handling: the
 * pydantic errors, the structured errors, the 404 detail, and more. The
 * successful sub-requests show no message.
 */
function handleBatchSubErrors(results: BatchRequestResult[]) {
  for (const result of results) {
    if (200 <= result.status_code && result.status_code < 300) {
      continue;
    }

    handleHttpError(
      new HTTPError({
        message: "Request Failed",
        status: result.status_code,
        silent: false,
        cause: (result.data ?? {}) as Record<string, unknown>,
      }),
    );
  }
}

/**
 * Creates a TanStack Query compatible query function that reads many
 * resources in one batch request.
 *
 * Use this function for reads only. Use {@link useBatchRequest} for writes.
 *
 * The batch endpoint always gives a 200 status if the transaction is
 * successful. Each sub-request keeps its own status code in the `results`
 * array. So you must check `status_code` of each result before you use its
 * `data`.
 *
 * Set `silent` to `true` if the caller shows the error itself. If you do not,
 * the global error handler shows a message for the full batch.
 *
 * Example:
 * ```tsx
 * const { data } = useQuery({
 *   queryKey: ["medication_dispense_batch", ids],
 *   queryFn: batchQuery<MedicationDispenseRetrieve>(
 *     ids.map((id) => ({
 *       api: medicationDispenseApi.get,
 *       pathParams: { id },
 *       referenceId: id,
 *     })),
 *     { silent: true },
 *   ),
 *   enabled: ids.length > 0,
 * });
 * ```
 */
export function batchQuery<T = unknown>(
  requests: BatchQueryObject[],
  options?: { silent?: boolean },
) {
  const body = buildBatchRequestBody(
    requests.map((request) => ({ ...request, body: {} })),
  );

  return async ({ signal }: { signal: AbortSignal }) => {
    const response = await query(batchRequestApi, {
      body,
      silent: options?.silent,
    })({ signal });

    return response as BatchRequestResponse<T>;
  };
}

/**
 * A hook to call the batch request API.
 *
 * The backend runs all the given requests in series in one atomic
 * transaction. If one request fails, the backend rolls back all the changes
 * and gives a 4xx/5xx status for the full batch.
 *
 * This hook shows the error of each failed sub-request through the global
 * error handler, and it shows no error for the successful sub-requests. Set
 * `silent` to `true` if the caller handles the errors itself.
 *
 * The original error still goes to the `onError` and `onSettled` callbacks.
 * The batch results are in `error.cause.results`.
 *
 * Example:
 * ```tsx
 * const { mutate: batchRequest, isPending } = useBatchRequest({
 *   onSuccess: ({ results }) => {
 *     toast.success(t("saved"));
 *   },
 * });
 *
 * const submit = () => {
 *   const requests: BatchRequestObject[] = [];
 *   // ... add requests
 *   batchRequest(requests);
 * };
 * ```
 */
export function useBatchRequest<TError = DefaultError, TContext = unknown>(
  options: UseMutationOptions<
    BatchRequestResponse,
    TError,
    BatchRequestObject[],
    TContext
  > & { silent?: boolean },
  queryClient?: QueryClient,
) {
  const { silent, ...mutationOptions } = options;

  return useMutation(
    {
      mutationFn: async (requests: BatchRequestObject[]) => {
        try {
          return await mutate(batchRequestApi)(buildBatchRequestBody(requests));
        } catch (error) {
          // Re-throw any error that is not a batch response so the global
          // error handler and the caller handle it as usual.
          if (!(error instanceof HTTPError) || !isBatchResponse(error.cause)) {
            throw error;
          }

          if (!silent) {
            handleBatchSubErrors(error.cause.results);
          }

          // We still need to throw so the caller treats this mutation as failed.
          throw new HTTPError({
            message: "Batch Request Failed",
            status: error.status,
            silent: true,
            cause: error.cause,
          });
        }
      },
      ...mutationOptions,
    },
    queryClient,
  );
}
