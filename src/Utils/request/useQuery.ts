import { useCallback, useEffect, useRef, useState } from "react";
import { QueryRoute, RequestOptions, RequestResult } from "./types";
import request from "./request";
import { makeUrl, mergeRequestOptions } from "./utils";
import { useQueryCache } from "./QueryCacheProvider";

export interface QueryOptions<TData> extends RequestOptions<TData> {
  prefetch?: boolean;
  refetchOnWindowFocus?: boolean;
  key?: string;
}

export default function useQuery<TData>(
  route: QueryRoute<TData>,
  options?: QueryOptions<TData>
) {
  const [response, setResponse] = useState<RequestResult<TData>>();
  const [loading, setLoading] = useState(false);
  const queryCache = useQueryCache();
  const cacheKey = makeUrl(route.path, options?.query, options?.pathParams);

  useEffect(() => {
    if (!route.enableExperimentalCache) return;

    const cachedResponse = queryCache.get(cacheKey);

    if (cachedResponse !== undefined) {
      console.info(`Cache HIT: "${cacheKey}"`);
      setResponse(cachedResponse as RequestResult<TData>);
    } else {
      console.info(`Cache MISS: "${cacheKey}"`);
    }
  }, [cacheKey]);

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
      const response = await request(route, resolvedOptions);
      if (route.enableExperimentalCache && response.res) {
        queryCache.set(response.res.url, response);
        console.info(`Cache SET: "${cacheKey}"`);
      }
      setResponse(response);
      setLoading(false);
      return response;
    },
    [route, JSON.stringify(options)]
  );

  useEffect(() => {
    if (options?.prefetch ?? queryCache.get(cacheKey) === undefined) {
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
