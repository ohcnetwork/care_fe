import { useQuery } from "@tanstack/react-query";

import request from "@/Utils/request/request";
import { QueryRoute, RequestOptions } from "@/Utils/request/types";

export interface QueryOptions<TData> extends RequestOptions<TData> {
  prefetch?: boolean;
  key?: string;
}

/**
 * Fetch data using TanStack's useQuery directly
 */
export function useGetNotifications<TData>(
  route: QueryRoute<TData>,
  options?: QueryOptions<TData>,
) {
  const {
    data: response,
    error,
    isFetching: loading,
    refetch,
  } = useQuery({
    queryKey: [route.path, options?.pathParams, options?.query, options?.key],
    queryFn: async ({ signal }) => {
      return await request(route, { ...options, signal });
    },
    enabled: options?.prefetch ?? true,
    refetchOnWindowFocus: false,
  });

  return {
    data: response?.data,
    loading,
    error,
    res: response?.res,
    refetch,
  };
}
