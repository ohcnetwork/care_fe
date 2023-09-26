import { LocalStorageKeys } from "../../Common/constants";
import { QueryParams, RequestOptions } from "./types";

export function makeUrl(
  path: string,
  query?: QueryParams,
  pathParams?: Record<string, string>
) {
  if (pathParams) {
    path = Object.entries(pathParams).reduce(
      (acc, [key, value]) => acc.replace(`{${key}}`, value),
      path
    );
  }

  ensurePathNotMissingReplacements(path);

  if (query) {
    path += `?${makeQueryParams(query)}`;
  }

  return path;
}

const makeQueryParams = (query: QueryParams) => {
  const qParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      qParams.set(key, `${value}`);
    }
  });

  return qParams.toString();
};

const ensurePathNotMissingReplacements = (path: string) => {
  const missingParams = path.match(/\{.*\}/g);

  if (missingParams) {
    throw new Error(`Missing path params: ${missingParams.join(", ")}`);
  }
};

export function makeHeaders(noAuth: boolean) {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  if (!noAuth) {
    const token = getAuthorizationHeader();

    if (token) {
      headers.append("Authorization", token);
    }
  }

  return headers;
}

export function getAuthorizationHeader() {
  const bearerToken = localStorage.getItem(LocalStorageKeys.accessToken);

  if (bearerToken) {
    return `Bearer ${bearerToken}`;
  }

  return null;
}

export function mergeRequestOptions<TData>(
  options: RequestOptions<TData>,
  overrides: RequestOptions<TData>
): RequestOptions<TData> {
  return {
    ...options,
    ...overrides,

    query: { ...options.query, ...overrides.query },
    body: { ...options.body, ...overrides.body },
    pathParams: { ...options.pathParams, ...overrides.pathParams },

    onResponse: (res) => {
      options.onResponse?.(res);
      overrides.onResponse?.(res);
    },
    silent: overrides.silent || options.silent,
  };
}
