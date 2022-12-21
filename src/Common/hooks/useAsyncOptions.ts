import { debounce } from "lodash";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

interface IUseAsyncOptionsArgs {
  uniqueKey?: string;
  debounceInterval?: number;
}

export function useAsyncOptions<T>({
  uniqueKey = "id",
  debounceInterval = 300,
}: IUseAsyncOptionsArgs = {}) {
  const dispatch = useDispatch<any>();

  const [selectedOptions, setSelectedOptions] = useState<T[]>([]);
  const [queryOptions, setQueryOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOptions = useMemo(
    () =>
      debounce(async (action: any) => {
        setIsLoading(true);
        const res = await dispatch(action);
        if (res?.data) setQueryOptions(res.data as T[]);
        setIsLoading(false);
      }, debounceInterval),
    [dispatch, debounceInterval]
  );

  const options = [
    ...selectedOptions,
    ...queryOptions.filter(
      (obj: any) =>
        !selectedOptions.some((s: any) => s[uniqueKey] === obj[uniqueKey])
    ),
  ];

  return {
    fetchOptions,
    isLoading,
    options,
    selectedOptions,
    setSelectedOptions,
  };
}
