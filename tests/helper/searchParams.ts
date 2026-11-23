import { expect, type Page, type Response } from "@playwright/test";

/** `path` with the query string of `params`. */
export function withSearch(
  path: string,
  params: Record<string, string> = {},
): string {
  const search = new URLSearchParams(params).toString();
  return search ? `${path}?${search}` : path;
}

/** Matches `key=value` in the query string of a URL, encoded as the app does. */
export function queryParam(key: string, value: string | number): RegExp {
  const pair = new URLSearchParams({ [key]: String(value) }).toString();
  return new RegExp(`[?&]${escapeRegExp(pair)}(&|$)`);
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The next GET response of the API path that ends with `pathEnd` and whose
 * query matches `match`. Call it before the action that sends the request.
 */
export function waitForApiList(
  page: Page,
  pathEnd: string,
  match: (params: URLSearchParams) => boolean = () => true,
): Promise<Response> {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname.endsWith(pathEnd) &&
      match(url.searchParams)
    );
  });
}

/**
 * Records the query parameters of the API requests that the page sends. Use
 * `expectNotSent(value)` to check that no parameter of any request had that
 * value (decoded and compared whole, so an id that contains it still passes).
 */
export function recordApiQueries(page: Page) {
  const queries: URLSearchParams[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) queries.push(url.searchParams);
  });
  return {
    expectNotSent(value: string) {
      const sent = queries.flatMap((params) =>
        [...params]
          .filter(([, paramValue]) => paramValue === value)
          .map(([key]) => `${key}=${value}`),
      );
      expect(sent).toEqual([]);
    },
  };
}

/**
 * The button of a filter select (`FilterSelect`). It shows the label of the
 * filter and the selected value, for example "Status" and "Draft".
 */
export function filterSelectButton(page: Page, text: string | RegExp) {
  return page
    .locator('[data-slot="filter-select"]')
    .getByRole("button")
    .filter({ hasText: text });
}
