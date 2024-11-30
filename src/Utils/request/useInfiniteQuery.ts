import { useCallback, useEffect, useState } from "react";

import { QueryRoute, RequestResult } from "@/Utils/request/types";
import useQuery, { QueryOptions } from "@/Utils/request/useQuery";

export interface InfiniteQueryOptions<TData, TItem>
  extends QueryOptions<TData> {
  getNextPageParam?: (currentPage: number) => number;
  getTotalPages?: (response: RequestResult<TData>) => number;
  itemsFromResponse?: (response: RequestResult<TData>) => TItem[];
  deduplicateBy?: (item: TItem) => string | number;
}

export function useInfiniteQuery<TData, TItem>(
  route: QueryRoute<TData>,
  options?: InfiniteQueryOptions<TData, TItem>,
) {
  const [pages, setPages] = useState<RequestResult<TData>[]>([]);
  const [items, setItems] = useState<TItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);

  const { refetch, loading, ...queryResponse } = useQuery(route, {
    ...options,
    prefetch: false,
  });

  const updateItems = useCallback(
    (newPages: RequestResult<TData>[]) => {
      const allItems = newPages.flatMap((page) =>
        options?.itemsFromResponse ? options.itemsFromResponse(page) : [],
      );
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
    [options],
  );

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || loading) return;

    const nextPageParam = options?.getNextPageParam
      ? options.getNextPageParam(currentPage + 1)
      : currentPage + 1;

    const response = await refetch({
      query: { offset: nextPageParam },
    });

    if (response) {
      setPages((prevPages) => {
        const newPages = [...prevPages, response];
        updateItems(newPages);
        return newPages;
      });
      setCurrentPage((prev) => prev + 1);

      const total = options?.getTotalPages?.(response) || totalPages;
      setTotalPages(total);
      setHasNextPage(currentPage + 1 < total);
    }
  }, [
    currentPage,
    hasNextPage,
    loading,
    options,
    refetch,
    totalPages,
    updateItems,
  ]);

  useEffect(() => {
    if (options?.prefetch ?? true) {
      refetch().then((response) => {
        if (response) {
          setPages([response]);
          updateItems([response]);
          const total = options?.getTotalPages?.(response) || totalPages;
          setTotalPages(total);
          setHasNextPage(currentPage < total);
        }
      });
    }
  }, [refetch, options?.prefetch, totalPages]);

  return {
    pages,
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
