import { useCallback, useEffect, useState } from "react";

import { QueryRoute, RequestResult } from "@/Utils/request/types";
import useQuery, { QueryOptions } from "@/Utils/request/useQuery";

export interface InfiniteQueryOptions<TData> extends QueryOptions<TData> {
  getNextPageParam?: (lastPage: number) => number;
  getTotalPages?: (response: RequestResult<TData>) => number;
}

export function useInfiniteQuery<TData>(
  route: QueryRoute<TData>,
  options?: InfiniteQueryOptions<TData>,
) {
  const [pages, setPages] = useState<RequestResult<TData>[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);

  const { refetch, loading, ...queryResponse } = useQuery(route, {
    ...options,
    prefetch: false, // Disable prefetching initially to control manually
  });

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || loading) return;

    const nextPageParam = options?.getNextPageParam
      ? options.getNextPageParam(currentPage + 1)
      : currentPage + 1;

    const response = await refetch({
      query: { offset: nextPageParam },
    });

    if (response) {
      setPages((prevPages) => [...prevPages, response]);
      setCurrentPage((prev) => prev + 1);

      const total = options?.getTotalPages?.(response) || totalPages;
      setTotalPages(total);
      setHasNextPage(currentPage + 1 < total);
    }
  }, [currentPage, hasNextPage, loading, options, refetch, totalPages]);

  const resetQuery = useCallback(() => {
    setPages([]);
    setCurrentPage(1);
    setTotalPages(1);
    setHasNextPage(true);
  }, []);

  const handleNewMessage = useCallback(() => {
    // resetQuery();

    refetch().then((response) => {
      if (response) {
        setPages([response]); // Set the new page of data
        const total = options?.getTotalPages?.(response) || totalPages;
        setTotalPages(total);
        setHasNextPage(total > 1);
      }
    });
  }, [resetQuery, refetch, options, totalPages]);

  useEffect(() => {
    if (options?.prefetch ?? true) {
      refetch().then((response) => {
        if (response) {
          setPages([response]);
          const total = options?.getTotalPages?.(response) || totalPages;
          setTotalPages(total);
          setHasNextPage(total > 1);
        }
      });
    }
  }, [refetch, options?.prefetch, totalPages]);

  return {
    pages,
    loading,
    fetchNextPage,
    hasNextPage,
    refetch,
    ...queryResponse,
    reset: resetQuery,
    handleNewMessage,
  };
}
