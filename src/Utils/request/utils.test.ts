// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { getResponseBody } from "@/Utils/request/utils";

const jsonResponse = (body: string) =>
  new Response(body, { headers: { "content-type": "application/json" } });

describe("getResponseBody", () => {
  it("parses valid JSON", async () => {
    await expect(getResponseBody(jsonResponse('{"a":1}'))).resolves.toEqual({
      a: 1,
    });
  });

  it("falls back to raw text for malformed JSON instead of throwing", async () => {
    await expect(
      getResponseBody(jsonResponse("<html>bad gateway</html>")),
    ).resolves.toBe("<html>bad gateway</html>");
  });

  it("returns null for an explicitly empty body", async () => {
    const res = new Response(null, {
      headers: { "content-length": "0", "content-type": "application/json" },
    });
    await expect(getResponseBody(res)).resolves.toBeNull();
  });

  it("returns text for non-JSON content types", async () => {
    const res = new Response("plain", {
      headers: { "content-type": "text/plain" },
    });
    await expect(getResponseBody(res)).resolves.toBe("plain");
  });
});
