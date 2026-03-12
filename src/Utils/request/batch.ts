import { BatchRequestResponse } from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import mutate from "@/Utils/request/mutate";
import { ApiRoute } from "@/Utils/request/types";
import { makeUrl } from "@/Utils/request/utils";
import {
  DefaultError,
  QueryClient,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";

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
): UseMutationResult<
  BatchRequestResponse,
  TError,
  BatchRequestObject[],
  TContext
> & {
  addToBatch: (request: BatchRequestObject) => void;
  requests: BatchRequestObject[];
} {
  const [requests, setRequests] = useState<BatchRequestObject[]>([]);

  const addToBatch = useCallback((request: BatchRequestObject) => {
    setRequests((prev) => [...prev, request]);
  }, []);

  console.log(requests);

  const mutation = useMutation<
    BatchRequestResponse,
    TError,
    BatchRequestObject[],
    TContext
  >(
    {
      mutationFn: () =>
        mutate(batchApi.batchRequest)({
          requests: requests.map((request: BatchRequestObject) => ({
            url: makeUrl(request.api.path, undefined, request.pathParams),
            method: request.api.method!,
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
    addToBatch,
    requests,
  };
}
