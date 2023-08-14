import { useCallback, useEffect, useRef, useState } from "react";
import { LocalStorageKeys } from "../../constants";

type QueryParams = ConstructorParameters<typeof URLSearchParams>[0];

interface RouteBase<TData> {
  path: string;
  TRes: TData;
  noAuth?: boolean;
}

interface QueryRoute<TData> extends RouteBase<TData> {
  method?: "GET";
}

// interface MutationRoute extends RouteBase {
//   method: "POST" | "PUT" | "PATCH" | "DELETE";
// }

interface QueryOptions {
  query?: QueryParams;
  pathParams?: Record<string, string>;
}

export default function useQuery<TData>(
  { path, noAuth }: QueryRoute<TData>,
  options: QueryOptions = {}
) {
  const [data, setData] = useState<TData>();
  const [error, setError] = useState<any>();
  const [loading, setLoading] = useState(false);

  const controllerRef = useRef<AbortController>();

  const runQuery = useCallback(
    async ({ query, pathParams }: QueryOptions = {}) => {
      const controller = new AbortController();
      const signal = controller.signal;

      controllerRef.current?.abort();
      controllerRef.current = controller;

      const headers = constructHeaders(noAuth ?? false);
      const url = constructEndpoint(path, query, pathParams);

      setLoading(true);

      try {
        const res = await fetch(url, { headers, signal });
        const data = await res.json();

        setData(data);
      } catch (error) {
        console.error(error);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [path, noAuth]
  );

  useEffect(() => {
    runQuery(options);
  }, [runQuery, JSON.stringify(options)]);

  return { data, error, loading, refetch: runQuery };
}

const constructEndpoint = (
  path: string,
  query?: QueryParams,
  pathParams?: Record<string, string>
) => {
  // TODO: add check for missing {path_params}

  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, value);
    });
  }

  if (query) {
    const qParams = new URLSearchParams(query);
    path += `?${qParams}`;
  }

  return path;
};

const constructHeaders = (noAuth: boolean) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  if (!noAuth) {
    const bearerToken = localStorage.getItem(LocalStorageKeys.accessToken);

    if (bearerToken) {
      headers.append("Authorization", `Bearer ${bearerToken}`);
    }
  }

  return headers;
};
