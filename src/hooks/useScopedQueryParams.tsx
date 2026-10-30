import { useQueryParams, type QueryParam } from "raviger";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type QueryState<T extends QueryParam = QueryParam> = ReturnType<
  typeof useQueryParams<T>
>;

const QueryParamsContext = createContext<QueryState | null>(null);

/** A widget's filters must not overwrite the page URL or a sibling's filters. */
export function ScopedQueryParamsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [params, setParams] = useState<QueryParam>({});
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

export function useScopedQueryParams<
  T extends QueryParam = QueryParam,
>(): QueryState<T> {
  const routed = useQueryParams<T>();
  const scoped = useContext(QueryParamsContext);
  return scoped ? [scoped[0] as T, scoped[1]] : routed;
}

export function useIsScopedQueryParams() {
  return useContext(QueryParamsContext) !== null;
}
