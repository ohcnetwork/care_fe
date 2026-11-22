import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useQueryParams,
  type QueryParams,
  type SetQueryParams,
} from "@/lib/router/queryParams";
import {
  readSearch,
  type SearchSchema,
  type SearchValues,
} from "@/lib/router/search/fields";

type QueryState = [QueryParams, SetQueryParams];

const QueryParamsContext = createContext<QueryState | null>(null);

/** A widget's filters must not overwrite the page URL or a sibling's filters. */
export function ScopedQueryParamsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [params, setParams] = useState<QueryParams>({});
  const update = useCallback<QueryState[1]>((next, options) => {
    setParams((previous) =>
      Object.fromEntries(
        Object.entries(
          options?.overwrite === false ? { ...previous, ...next } : next,
        ).filter(([, value]) => value !== undefined && value !== null),
      ),
    );
  }, []);
  // A stable tuple keeps every consumer from re-rendering on unrelated updates.
  const value = useMemo<QueryState>(() => [params, update], [params, update]);
  return (
    <QueryParamsContext.Provider value={value}>
      {children}
    </QueryParamsContext.Provider>
  );
}

/**
 * `useQueryParams(schema)`, or the params of the nearest
 * `ScopedQueryParamsProvider`, parsed with the same schema.
 */
export function useScopedQueryParams<S extends SearchSchema>(
  schema: S,
): [SearchValues<S>, SetQueryParams] {
  const routed = useQueryParams();
  const scoped = useContext(QueryParamsContext);
  const [params, setParams] = scoped ?? routed;
  return [readSearch(schema, params), setParams];
}

export function useIsScopedQueryParams() {
  return useContext(QueryParamsContext) !== null;
}
