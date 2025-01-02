import React from "react";

import request from "@/Utils/request/request";
import {
  MutationRoute,
  RequestOptions,
  RequestResult,
} from "@/Utils/request/types";
import { mergeRequestOptions } from "@/Utils/request/utils";

/**
 * @deprecated use `useMutation` from `@tanstack/react-query` instead.
 */
export default function useDeprecatedMutation<TData, TBody>(
  route: MutationRoute<TData, TBody>,
  options: RequestOptions<TData, TBody>,
) {
  const [response, setResponse] = React.useState<RequestResult<TData>>();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const controllerRef = React.useRef<AbortController>();

  const runQuery = React.useCallback(
    async (overrides?: RequestOptions<TData, TBody>) => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const resolvedOptions =
        options && overrides
          ? mergeRequestOptions(options, overrides)
          : (overrides ?? options);

      setIsProcessing(true);
      const response = await request(route, {
        ...resolvedOptions,
        signal: controller.signal,
      });
      if (response.error?.name !== "AbortError") {
        setResponse(response);
        setIsProcessing(false);
      }
      return response;
    },
    [route, JSON.stringify(options)],
  );

  return { ...response, isProcessing, mutate: runQuery };
}
