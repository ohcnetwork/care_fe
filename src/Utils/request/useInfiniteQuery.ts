import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import request from "@/Utils/request/request";
import { PaginatedResponse, QueryRoute } from "@/Utils/request/types";

import { QueryOptions } from "./useQuery";
import { mergeRequestOptions } from "./utils";

/**
 * @deprecated Use `useInfiniteQuery` from `@tanstack/react-query` instead.
 */
export function useTanStackInfiniteQueryInstead<TItem>(
  route: QueryRoute<PaginatedResponse<TItem>>,
  options?: QueryOptions<PaginatedResponse<TItem>>,
) {
  const overridesRef = useRef<QueryOptions<PaginatedResponse<TItem>>>();

  // Ensure a unique key for the query
  const key = useMemo(() => options?.key ?? Math.random(), [options?.key]);

  const {
    data: response,
    fetchNextPage,
    hasNextPage,
    isFetching: isLoading,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [route.path, options?.pathParams, options?.query, key],
    queryFn: async ({ pageParam = 0, signal }) => {
      const resolvedOptions = overridesRef.current
        ? mergeRequestOptions(options || {}, overridesRef.current)
        : options;

      const response = await request(route, {
        ...resolvedOptions,
        query: {
          ...resolvedOptions?.query,
          offset: pageParam,
        },
        signal,
      });

      return {
        data: response?.data ?? {
          results: [],
          next: null,
          previous: null,
          count: 0,
        },
      };
    },
    enabled: options?.prefetch ?? true,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) => {
      const totalResults = lastPage.data.count;
      const currentResults = lastPage.data.results.length + lastPageParam;
      if (currentResults < totalResults) {
        return lastPageParam + RESULTS_PER_PAGE_LIMIT;
      }

      return undefined;
    },
  });

  return {
    data: response?.pages.flatMap((page) => page.data.results) || [],
    loading: isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: async (overrides?: QueryOptions<PaginatedResponse<TItem>>) => {
      overridesRef.current = overrides;
      await refetch();
      return response!;
    },
  };
}
