import { useCallback, useEffect, useRef, useState } from "react";
import { QueryRoute, RequestOptions } from "./types";
import request from "./request";
import { mergeRequestOptions } from "./utils";

export interface QueryOptions extends RequestOptions {
  prefetch?: boolean;
  refetchOnWindowFocus?: boolean;
}

export default function useQuery<TData>(
  route: QueryRoute<TData>,
  options?: QueryOptions
) {
  const [res, setRes] = useState<Response>();
  const [data, setData] = useState<TData>();
  const [error, setError] = useState<any>();
  const [loading, setLoading] = useState(false);

  const controllerRef = useRef<AbortController>();

  const runQuery = useCallback(
    async (overrides?: QueryOptions) => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const resolvedOptions =
        options && overrides
          ? mergeRequestOptions(options, overrides)
          : options;

      setLoading(true);

      try {
        const { res, data } = await request<TData>(route, resolvedOptions);

        setRes(res);
        setData(res.ok ? data : undefined);
        setError(res.ok ? undefined : data);
      } catch (error) {
        console.error(error);
        setData(undefined);
        setError(error);
      } finally {
        setLoading(false);
      }
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

  return { res, data, error, loading, refetch: runQuery };
}
