/**
 * Search param (de)serialization that keeps the URL format the app already
 * uses: every value stays a string, duplicate keys keep the last value, and
 * `URLSearchParams` does the encoding (a space becomes `+`).
 *
 * TanStack Router's default JSON serializer would turn `?phone=9876543210`
 * into a number and write the string `"123"` as `%22123%22`. Both break
 * existing links, bookmarks and the Playwright suite.
 */
export type SearchRecord = Record<string, string>;

export function parseSearch(searchStr: string): SearchRecord {
  const query = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
  return Object.fromEntries(new URLSearchParams(query).entries());
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === null || value === undefined) continue;
    params.set(key, String(value));
  }
  const result = params.toString();
  return result ? `?${result}` : "";
}
