import careConfig from "@careConfig";

import { HTTPError } from "@/Utils/request/types";
import { getAuthorizationHeader } from "@/Utils/request/utils";

/**
 * Resolves a CARE file path against the configured API origin.
 *
 * The backend returns relative paths for file transport (`download_url`,
 * `read_cover_image_url`, `profile_picture_url`). The frontend origin is not
 * necessarily the API origin, so these cannot be used as-is. When `apiUrl` is
 * empty the app is served from the API origin and the path is already correct.
 */
export function careFileUrl(path?: string | null): string {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path)) return path;
  return `${careConfig.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseErrorBody(res: Response) {
  try {
    return await res.clone().json();
  } catch {
    return undefined;
  }
}

/**
 * Fetches a CARE-mediated file as a Blob.
 *
 * File downloads are authenticated with the same bearer token as the rest of
 * the API, which a plain navigation or `<img src>` cannot carry, so the bytes
 * are fetched here and handed to the caller as a Blob to wrap in an object URL.
 *
 * Throws {@link HTTPError} so callers surface failures through the app's
 * existing error model.
 */
export async function fetchCareFileBlob(
  path: string,
  options?: { signal?: AbortSignal; silent?: boolean },
): Promise<Blob> {
  const headers = new Headers();
  const authorization = getAuthorizationHeader();
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  let res: Response;
  try {
    res = await fetch(careFileUrl(path), {
      headers,
      signal: options?.signal,
    });
  } catch {
    throw new Error("Network Error");
  }

  if (!res.ok) {
    throw new HTTPError({
      message: "Request Failed",
      status: res.status,
      silent: options?.silent ?? false,
      cause: await parseErrorBody(res),
    });
  }

  return res.blob();
}

/**
 * Fetches a CARE-mediated file and wraps it in an object URL.
 *
 * The caller owns the returned URL and must pass it to `URL.revokeObjectURL`
 * once the element referencing it is gone.
 */
export async function createCareFileObjectUrl(
  path: string,
  options?: { signal?: AbortSignal; silent?: boolean },
): Promise<string> {
  const blob = await fetchCareFileBlob(path, options);
  return URL.createObjectURL(blob);
}
