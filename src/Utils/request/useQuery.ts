import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

import request from "@/Utils/request/request";
import { QueryRoute, RequestOptions } from "@/Utils/request/types";

import { mergeRequestOptions } from "./utils";

export interface QueryOptions<TData> extends RequestOptions<TData> {
  prefetch?: boolean;
  key?: string;
}

/**
 * @deprecated use `useQuery` from `@tanstack/react-query` instead.
 */
export default function useTanStackQueryInstead<TData>(
  route: QueryRoute<TData>,
  options?: QueryOptions<TData>,
) {
  const overridesRef = useRef<QueryOptions<TData>>();
  const {
    data: response,
    refetch,
    isFetching: isLoading,
  } = useQuery({
    queryKey: [route.path, options?.pathParams, options?.query],
    queryFn: async ({ signal }) => {
      const resolvedOptions = overridesRef.current
        ? mergeRequestOptions(options || {}, overridesRef.current)
        : options;

      return await request(route, { ...resolvedOptions, signal });
    },
    enabled: options?.prefetch ?? true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    data: response?.data,
    loading: isLoading,
    error: response?.error,
    res: response?.res,
    /**
     * Refetch function that applies new options and fetches fresh data.
     */
    refetch: async (overrides?: QueryOptions<TData>) => {
      overridesRef.current = overrides;
      await refetch();
      return response!;
    },
  };
}
