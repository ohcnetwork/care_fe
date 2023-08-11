import { useCallback, useEffect, useState } from "react";

export type QueryAction<TParams, TData> = (params: TParams) => Promise<TData>;

export type Return<TData> = {
  data: TData;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

export const useMutation = <TParams, TData>(
  action: QueryAction<TParams, TData>
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    (params: TParams) => {
      setLoading(true);
      setError(null);
      return action(params)
        .catch((error) => {
          setError(error);
          return null;
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [action]
  );

  return {
    mutate,
    loading,
    error,
  };
};

export default function useQuery<TParams, TData>(
  action: QueryAction<TParams, TData>,
  params: TParams
) {
  const [data, setData] = useState<TData | null>(null);
  const { mutate, loading, error } = useMutation(action);

  const refetch = useCallback(() => {
    mutate(params).then((data) => {
      setData(data);
    });
  }, [mutate, params]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
