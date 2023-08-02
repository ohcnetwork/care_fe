import { debounce } from "lodash";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

interface IUseAsyncOptionsArgs {
  debounceInterval?: number;
  queryResponseExtractor?: (data: any) => any;
}

/**
 * Hook to implement async autocompletes with ease and typesafety.
 *
 * See `DiagnosisSelectFormField` for usage.
 *
 * **Example usage:**
 * ```jsx
 * const { fetchOptions, isLoading, options } = useAsyncOptions<Model>("id");
 *
 * return (
 *   <AutocompleteMultiselect
 *     ...
 *     options={options(props.value)}
 *     isLoading={isLoading}
 *     onQuery={(query) => fetchOptions(action({ query }))}
 *     optionValue={(option) => option}
 *     ...
 *   />
 * );
 * ```
 */
export function useAsyncOptions<T extends Record<string, unknown>>(
  uniqueKey: keyof T,
  args?: IUseAsyncOptionsArgs
) {
  const dispatch = useDispatch<any>();
  const [queryOptions, setQueryOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOptions = useMemo(
    () =>
      debounce(async (action: any) => {
        setIsLoading(true);
        const res = await dispatch(action);
        if (res?.data)
          setQueryOptions(
            args?.queryResponseExtractor?.(res.data) ?? (res.data as T[])
          );
        setIsLoading(false);
      }, args?.debounceInterval ?? 300),
    [dispatch, args?.debounceInterval]
  );

  const mergeValueWithQueryOptions = (selected?: T[]) => {
    if (!selected?.length) return queryOptions;

    return [
      ...selected,
      ...queryOptions.filter(
        (option) => !selected.find((s) => s[uniqueKey] === option[uniqueKey])
      ),
    ];
  };

  return {
    /**
     * Merges query options and selected options.
     *
     * **Example usage:**
     * ```jsx
     * const { isLoading } = useAsyncOptions<Model>("id");
     *
     * <AutocompleteMultiselect
     *   ...
     *   isLoading={isLoading}
     *   ...
     * />
     * ```
     */
    fetchOptions,

    /**
     * Merges query options and selected options.
     *
     * **Example usage:**
     * ```jsx
     * const { options } = useAsyncOptions<Model>("id");
     *
     * <AutocompleteMultiselect
     *   ...
     *   onQuery={(query) => fetchOptions(action({ query }))}
     *   ...
     * />
     * ```
     */
    isLoading,

    /**
     * Merges query options and selected options.
     *
     * **Example usage:**
     * ```jsx
     * const { options } = useAsyncOptions<Model>("id");
     *
     * <AutocompleteMultiselect
     *   ...
     *   options={options(props.value)}
     *   ...
     * />
     * ```
     */
    options: mergeValueWithQueryOptions,
  };
}
