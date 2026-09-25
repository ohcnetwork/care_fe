import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

test("value-set searches isolate postfixes while sharing stable slug resolution", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", {
    url: "http://localhost",
  });
  const requests: { url: string; search: string; count: number }[] = [];
  const globals = {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        search: string;
        count: number;
      };
      requests.push({ url: String(url), ...body });
      return Response.json({
        valueset: { id: "resolved-id" },
        results: [{ code: body.search, display: body.search }],
      });
    },
  };
  const previousGlobals = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  const require = createRequire(import.meta.url);
  const configPath = require.resolve("@careConfig");
  const previousConfig = require.cache[configPath];
  const configModule = new Module(configPath);
  configModule.exports = { apiUrl: "http://localhost:9000" };
  configModule.loaded = true;
  require.cache[configPath] = configModule;

  const { useValueSetSearchResults } =
    await import("./useValueSetSearchResults");
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Infinity },
    },
  });
  function Search({ postfix, pinned }: { postfix: string; pinned: boolean }) {
    const { searchQuery, valuesetId } = useValueSetSearchResults({
      system: "shared-slug",
      pinnedValuesetId: pinned ? "pinned-id" : undefined,
      facilityId: "facility",
      count: 10,
      search: "term",
      searchPostFix: postfix,
    });
    return createElement(
      "output",
      { "data-picker": `${pinned}-${postfix}`, "data-valueset": valuesetId },
      searchQuery.data?.results[0]?.code ?? "loading",
    );
  }
  const render = (firstPostfix: string) => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        ...[true, false].flatMap((pinned) =>
          [firstPostfix, " second"].map((postfix, index) =>
            createElement(Search, {
              key: `${pinned}-${index}`,
              pinned,
              postfix,
            }),
          ),
        ),
      ),
    );
  };
  const waitForResults = async () => {
    const deadline = Date.now() + 3000;
    while (
      container.textContent?.includes("loading") &&
      Date.now() < deadline
    ) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    }
    for (const output of container.querySelectorAll("output")) {
      const postfix = output
        .getAttribute("data-picker")!
        .replace(/^(true|false)-/, "");
      assert.equal(output.textContent, `term${postfix}`);
      assert.equal(
        output.getAttribute("data-valueset"),
        output.getAttribute("data-picker")!.startsWith("true")
          ? "pinned-id"
          : "resolved-id",
      );
    }
  };
  try {
    await act(async () => render(" first"));
    await waitForResults();
    assert.equal(requests.filter(({ count }) => count === 10).length, 4);
    await act(async () => render(" changed"));
    assert.equal(
      container.querySelector('[data-picker="true- changed"]')?.textContent,
      "loading",
      "a changed postfix must not display another search's cached results",
    );
    await waitForResults();
    assert.equal(requests.filter(({ count }) => count === 10).length, 6);
    assert.equal(
      requests.filter(({ count }) => count === 1).length,
      1,
      "typing and postfix changes must not repeat slug resolution",
    );
  } finally {
    await act(async () => root.unmount());
    client.clear();
    dom.window.close();
    if (previousConfig) require.cache[configPath] = previousConfig;
    else delete require.cache[configPath];
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
