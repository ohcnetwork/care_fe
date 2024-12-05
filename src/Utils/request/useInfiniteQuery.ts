import { useCallback, useState } from "react";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import { PaginatedResponse, QueryRoute } from "@/Utils/request/types";
import useQuery, { QueryOptions } from "@/Utils/request/useQuery";

export interface InfiniteQueryOptions<TItem> extends QueryOptions<TItem> {
  deduplicateBy?: (item: TItem) => string | number;
}

export function useInfiniteQuery<TItem>(
  route: QueryRoute<PaginatedResponse<TItem>>,
  options?: InfiniteQueryOptions<TItem>,
) {
  const [items, setItems] = useState<TItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(1);
  const [offset, setOffset] = useState(0);

  const { refetch, loading, ...queryResponse } = useQuery(route, {
    ...options,
    query: {
      ...(options?.query ?? {}),
      offset,
    },
    onResponse: ({ data }) => {
      if (!data) return;
      const allItems = items.concat(data.results);
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
      setTotalCount(data.count);
    },
  });

  const fetchNextPage = useCallback(async () => {
    if (loading) return;

    const nextPageParam = currentPage * RESULTS_PER_PAGE_LIMIT;
    setOffset(nextPageParam);
  }, [currentPage, loading]);

  return {
    items,
    loading,
    fetchNextPage,
    refetch,
    currentPage,
    totalCount,
    setCurrentPage,
    setTotalCount,
    hasMore: totalCount / RESULTS_PER_PAGE_LIMIT > offset,
    ...queryResponse,
  };
}
