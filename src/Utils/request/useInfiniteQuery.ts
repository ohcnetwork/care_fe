import { useCallback, useEffect, useState } from "react";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import {
  PaginatedResponse,
  QueryRoute,
  RequestResult,
} from "@/Utils/request/types";
import useQuery, { QueryOptions } from "@/Utils/request/useQuery";

export interface InfiniteQueryOptions<TItem>
  extends QueryOptions<PaginatedResponse<TItem>> {
  deduplicateBy?: (item: TItem) => string | number;
}

export function useInfiniteQuery<TItem>(
  route: QueryRoute<PaginatedResponse<TItem>>,
  options?: InfiniteQueryOptions<TItem>,
) {
  const [items, setItems] = useState<TItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const { refetch, loading, ...queryResponse } = useQuery(route, {
    ...options,
    prefetch: false,
  });

  const updateItems = useCallback(
    (response: RequestResult<PaginatedResponse<TItem>>) => {
      if (!response?.data) return;
      const allItems = response.data.results || [];
      const deduplicatedItems = options?.deduplicateBy
        ? Array.from(
            allItems
              .reduce(
                (map, item) => map.set(options.deduplicateBy!(item), item),
                new Map<string | number, TItem>(),
              )
              .values(),
          )
        : allItems;

      setItems(deduplicatedItems);
    },
    [options?.deduplicateBy],
  );

  const fetchNextPage = useCallback(async () => {
    if (loading) return;

    const nextPageParam = currentPage * RESULTS_PER_PAGE_LIMIT;

    const response = await refetch({
      query: { offset: nextPageParam },
    });

    if (response?.data) {
      setCurrentPage((prev) => prev + 1);
      const newItems = response.data.results || [];

      const deduplicatedItems = options?.deduplicateBy
        ? Array.from(
            [...items, ...newItems]
              .reduce(
                (map, item) => map.set(options.deduplicateBy!(item), item),
                new Map<string | number, TItem>(),
              )
              .values(),
          )
        : [...items, ...newItems];

      setItems(deduplicatedItems);

      const total = Math.ceil(response.data.count / RESULTS_PER_PAGE_LIMIT);
      setTotalPages(total);
    }
  }, [currentPage, loading, options, refetch, items]);

  useEffect(() => {
    if (options?.prefetch ?? true) {
      refetch().then((response) => {
        if (response?.data) {
          updateItems(response);
          const total = Math.ceil(response.data.count / RESULTS_PER_PAGE_LIMIT);
          setTotalPages(total);
        }
      });
    }
  }, [refetch, options?.prefetch, totalPages]);

  const hasNextPage = currentPage < totalPages;

  return {
    items,
    loading,
    fetchNextPage,
    hasNextPage,
    refetch,
    currentPage,
    totalPages,
    setCurrentPage,
    setTotalPages,
    ...queryResponse,
  };
}
