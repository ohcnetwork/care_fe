import { debounce } from "lodash";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

export function useAsyncOptions<T>(debounceInterval = 300) {
  const dispatch = useDispatch<any>();
  const [options, setOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOptions = useMemo(
    () =>
      debounce(async (action: any) => {
        setIsLoading(true);
        const res = await dispatch(action);
        if (res?.data) setOptions(res.data as T[]);
        setIsLoading(false);
      }, debounceInterval),
    [dispatch, debounceInterval]
  );

  return { fetchOptions, isLoading, options };
}
