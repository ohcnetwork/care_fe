// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { API } from "@/Utils/request/utils";

const testRoute = API<PaginatedResponse<number>>("GET /api/test/");

const page = (count: number, results: number[]) =>
  new Response(JSON.stringify({ count, results }), {
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("query.paginated", () => {
  it("stops when the server returns an empty page despite a larger count", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(page(5, [1, 2]))
      .mockResolvedValueOnce(page(5, []));
    vi.stubGlobal("fetch", fetchMock);

    const result = await query.paginated(testRoute, { pageSize: 2 })({
      signal: new AbortController().signal,
    });

    expect(result.results).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }, 2000);

  it("accumulates pages until count is reached", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(page(4, [1, 2]))
      .mockResolvedValueOnce(page(4, [3, 4]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await query.paginated(testRoute, { pageSize: 2 })({
      signal: new AbortController().signal,
    });

    expect(result.results).toEqual([1, 2, 3, 4]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }, 2000);
});
