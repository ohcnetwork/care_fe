import { useMemo, useState } from "react";

import { debounce } from "lodash-es";
import { mergeQueryOptions } from "../../Utils/utils";

interface IUseAsyncOptionsArgs {
  debounceInterval?: number;
  queryResponseExtractor?: (data: any) => any;
}

/**
 * Deprecated. This is no longer needed as `useQuery` with `mergeQueryOptions`
 * can be reused for this.
 *
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
 *     onQuery={(query) => fetchOptions(async () => { ... })}
 *     optionValue={(option) => option}
 *     ...
 *   />
 * );
 * ```
 */
export function useAsyncOptions<T extends Record<string, unknown>>(
  uniqueKey: keyof T,
  args?: IUseAsyncOptionsArgs,
) {
  const [queryOptions, setQueryOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOptions = useMemo(
    () =>
      debounce(async (fetchFn: () => Promise<T[]>) => {
        setIsLoading(true);
        const data = await fetchFn();
        if (data) setQueryOptions(args?.queryResponseExtractor?.(data) ?? data);
        setIsLoading(false);
      }, args?.debounceInterval ?? 300),
    [args?.debounceInterval],
  );

  const mergeValueWithQueryOptions = (selected?: T[]) => {
    return mergeQueryOptions(
      selected ?? [],
      queryOptions,
      (obj) => obj[uniqueKey],
    );
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
