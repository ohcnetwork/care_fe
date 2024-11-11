import { Dispatch, SetStateAction } from "react";

import { LocalStorageKeys } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import { QueryParams, RequestOptions } from "@/Utils/request/types";

export function makeUrl(
  path: string,
  query?: QueryParams,
  pathParams?: Record<string, string | number>,
) {
  if (pathParams) {
    path = Object.entries(pathParams).reduce(
      (acc, [key, value]) => acc.replace(`{${key}}`, `${value}`),
      path,
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
    const msg = `Missing path params: ${missingParams.join(
      ", ",
    )}. Path: ${path}`;
    Notification.Error({ msg });
    throw new Error(msg);
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
  overrides: RequestOptions<TData>,
): RequestOptions<TData> {
  return {
    ...options,
    ...overrides,

    query: { ...options.query, ...overrides.query },
    body: (options.body || overrides.body) && {
      ...(options.body ?? {}),
      ...(overrides.body ?? {}),
    },
    pathParams: { ...options.pathParams, ...overrides.pathParams },

    onResponse: (res) => {
      options.onResponse?.(res);
      overrides.onResponse?.(res);
    },
    silent: overrides.silent ?? options.silent,
  };
}

export function handleUploadPercentage(
  event: ProgressEvent,
  setUploadPercent: Dispatch<SetStateAction<number>>,
) {
  if (event.lengthComputable) {
    const percentComplete = Math.round((event.loaded / event.total) * 100);
    setUploadPercent(percentComplete);
  }
}
