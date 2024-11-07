import { useCallback, useEffect, useRef, useState } from "react";

import request from "@/Utils/request/request";
import {
  QueryRoute,
  RequestOptions,
  RequestResult,
} from "@/Utils/request/types";
import { mergeRequestOptions } from "@/Utils/request/utils";

export interface QueryOptions<TData> extends RequestOptions<TData> {
  prefetch?: boolean;
  refetchOnWindowFocus?: boolean;
  key?: string;
}

export default function useQuery<TData>(
  route: QueryRoute<TData>,
  options?: QueryOptions<TData>,
) {
  const [response, setResponse] = useState<RequestResult<TData>>();
  const [loading, setLoading] = useState(false);

  const controllerRef = useRef<AbortController>();

  const runQuery = useCallback(
    async (overrides?: QueryOptions<TData>) => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const resolvedOptions =
        options && overrides
          ? mergeRequestOptions(options, overrides)
          : (overrides ?? options);

      setLoading(true);
      const response = await request(route, { ...resolvedOptions, controller });
      setResponse(response);
      setLoading(false);
      return response;
    },
    [route, JSON.stringify(options)],
  );

  useEffect(() => {
    if (options?.prefetch ?? true) {
      runQuery();
    }
  }, [runQuery, options?.prefetch]);

  useEffect(() => {
    if (options?.refetchOnWindowFocus) {
      const onFocus = () => runQuery();

      window.addEventListener("focus", onFocus);

      return () => window.removeEventListener("focus", onFocus);
    }
  }, [runQuery, options?.refetchOnWindowFocus]);

  return { ...response, loading, refetch: runQuery };
}
