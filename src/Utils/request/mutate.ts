import {
  BatchRequestObject,
  batchRequestRoute,
  buildBatchRequestBody,
  isBatchResult,
} from "@/Utils/request/batch";
import { handleHttpError } from "@/Utils/request/errorHandler";
import { callApi } from "@/Utils/request/query";
import { ApiCallOptions, ApiRoute, HTTPError } from "@/Utils/request/types";
import { BatchRequestResponse } from "@/types/base/batch/batch";

/**
 * Creates a TanStack Query compatible mutation function.
 *
 * Example:
 * ```tsx
 * const { mutate: createPrescription, isPending } = useMutation({
 *   mutationFn: mutate(MedicineRoutes.createPrescription, {
 *     pathParams: { consultationId },
 *   }),
 *   onSuccess: () => {
 *     toast.success(t("medication_request_prescribed"));
 *   },
 * });
 * ```
 */
export default function mutate<Route extends ApiRoute<unknown, unknown>>(
  route: Route,
  options?: ApiCallOptions<Route>,
) {
  return (variables: Route["TBody"]) => {
    return callApi(route, { ...options, body: variables });
  };
}

type AtomicOptions = Pick<
  ApiCallOptions<typeof batchRequestRoute>,
  "silent" | "headers" | "signal"
>;

/**
 * Executes an array of requests as a single atomic batch request.
 */
export async function callAtomicApi<T = unknown>(
  requests: BatchRequestObject[],
  options?: AtomicOptions,
): Promise<BatchRequestResponse<T>> {
  try {
    const response = await callApi(batchRequestRoute, {
      ...options,
      body: buildBatchRequestBody(requests),
    });
    return response as unknown as BatchRequestResponse<T>;
  } catch (error) {
    if (error instanceof HTTPError && isBatchResult(error.cause)) {
      for (const result of error.cause.results) {
        if (result.status_code < 400) continue;
        handleHttpError(
          new HTTPError({
            message: error.message,
            status: result.status_code,
            silent: error.silent,
            cause: result.data as Record<string, unknown>,
          }),
        );
      }
    }
    throw error;
  }
}

/**
 * Creates a TanStack Query compatible mutation function that dispatches an
 * array of requests as a single atomic batch request.
 *
 * Unlike a raw batch request, sub-response errors are handled per-request: on
 * failure only the non-2xx sub-responses are surfaced to the error handler.
 *
 * Example:
 * ```tsx
 * const { mutate: dispense } = useMutation({
 *   mutationFn: mutate.atomic(),
 *   onSuccess: (response) => {
 *     // response.results is the array of successful sub-responses
 *   },
 * });
 *
 * dispense([
 *   { api: medicationDispenseApi.create, body: dispenseData, referenceId: "d1" },
 *   { api: prescriptionApi.upsert, pathParams: { patientId }, body, referenceId: "p1" },
 * ]);
 * ```
 */
mutate.atomic = <T = unknown>(options?: AtomicOptions) => {
  return (requests: BatchRequestObject[]) =>
    callAtomicApi<T>(requests, options);
};
