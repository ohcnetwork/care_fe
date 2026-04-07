import {
  BatchRequestBody,
  BatchRequestResponse,
} from "@/types/base/batch/batch";
import mutate from "@/Utils/request/mutate";
import { ApiRoute, HttpMethod, Type } from "@/Utils/request/types";
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
        mutate({
          path: "/api/v1/batch_requests/",
          method: HttpMethod.POST,
          TRes: Type<BatchRequestResponse>(),
          TBody: Type<BatchRequestBody>(),
        })({
          requests: requests.map((request) => ({
            url: makeUrl(request.api.path, undefined, request.pathParams),
            method: request.api.method ?? HttpMethod.GET,
            reference_id: request.referenceId,
            body: request.body,
          })),
        }),
      ...options,
    },
    queryClient,
  );

  return {
    ...mutation,
  };
}
