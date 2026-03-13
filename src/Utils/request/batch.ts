import { BatchRequestResponse } from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import mutate from "@/Utils/request/mutate";
import { ApiRoute, HttpMethod } from "@/Utils/request/types";
import { makeUrl } from "@/Utils/request/utils";
import {
  DefaultError,
  QueryClient,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";

export interface BatchRequestObject<T = unknown> {
  api: ApiRoute<unknown, unknown>;
  pathParams?: Record<string, string>;
  body: T;
  referenceId: string;
}

export function useBatchRequest<TError = DefaultError, TContext = unknown>(
  options: UseMutationOptions<BatchRequestResponse, TError, void, TContext>,
  queryClient?: QueryClient,
) {
  const [requests, setRequests] = useState<BatchRequestObject[]>([]);

  const addToBatch = useCallback((request: BatchRequestObject) => {
    setRequests((prev) => [...prev, request]);
  }, []);

  const mutation = useMutation(
    {
      mutationFn: () =>
        mutate(batchApi.batchRequest)({
          requests: requests.map((request: BatchRequestObject) => ({
            url: makeUrl(request.api.path, undefined, request.pathParams),
            method: request.api.method ?? HttpMethod.GET,
            reference_id: request.referenceId,
            body: request.body,
          })),
        }),
      onSuccess: (data, variables, context) => {
        options.onSuccess?.(data, variables, context);
        setRequests([]);
      },
      ...options,
    },
    queryClient,
  );

  return {
    ...mutation,
    addToBatch,
  };
}
