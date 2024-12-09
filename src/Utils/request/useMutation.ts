import React from "react";

import request from "@/Utils/request/request";
import { RequestOptions, RequestResult, Route } from "@/Utils/request/types";
import { mergeRequestOptions } from "@/Utils/request/utils";

/**
 * Deprecated: use `useMutation` from `@tanstack/react-query` instead.
 */
export default function useMutation<TData, TBody>(
  route: Route<TData, TBody>,
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
      const response = await request(route, { ...resolvedOptions, controller });
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
