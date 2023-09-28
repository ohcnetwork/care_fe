import { useCallback, useEffect, useRef, useState } from "react";
import { QueryRoute, RequestOptions, RequestResult } from "./types";
import request from "./request";
import { mergeRequestOptions } from "./utils";

export interface QueryOptions<TData> extends RequestOptions<TData> {
  prefetch?: boolean;
  refetchOnWindowFocus?: boolean;
}

export default function useQuery<TData>(
  route: QueryRoute<TData>,
  options?: QueryOptions<TData>
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
          : options;

      setLoading(true);
      setResponse(await request(route, resolvedOptions));
      setLoading(false);
    },
    [route, JSON.stringify(options)]
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
