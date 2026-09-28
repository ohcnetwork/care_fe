import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

test("optional facility context follows client-side navigation without changing hook order", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", {
    url: "http://localhost/admin/questionnaires",
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
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

  // Node has no Vite environment; the real router, hook, and query cache run
  // against cached facility responses without making network requests.
  const require = createRequire(import.meta.url);
  const configPath = require.resolve("@careConfig");
  const previousConfig = require.cache[configPath];
  const config = new Module(configPath);
  config.exports = { apiUrl: "http://localhost:9000" };
  config.loaded = true;
  require.cache[configPath] = config;

  const { useCurrentFacilitySilently } = await import("./useCurrentFacility");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const first = { id: "first", name: "First facility" };
  const second = { id: "second", name: "Second facility" };
  client.setQueryData(["facility", first.id], first);
  client.setQueryData(["facility", second.id], second);
  let current!: ReturnType<typeof useCurrentFacilitySilently>;
  function Harness() {
    current = useCurrentFacilitySilently();
    return createElement("span", null, current.facility?.name ?? "No facility");
  }
  const root = createRoot(dom.window.document.getElementById("root")!);
  async function navigate(path: string) {
    await act(async () => {
      dom.window.history.pushState(null, "", path);
      dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
    });
  }

  try {
    await act(async () => {
      root.render(
        createElement(QueryClientProvider, {
          client,
          children: createElement(Harness),
        }),
      );
    });
    assert.equal(current.facilityId, undefined);
    assert.equal(current.isFacilityLoading, false);

    await navigate("/facility/first/settings/questionnaires");
    assert.equal(current.facilityId, first.id);
    assert.equal(current.facility?.name, first.name);

    await navigate("/facility/second/settings/valuesets");
    assert.equal(current.facilityId, second.id);
    assert.equal(current.facility?.name, second.name);

    await navigate("/admin/valuesets");
    assert.equal(current.facilityId, undefined);
    assert.equal(current.facility, undefined);
    assert.equal(current.isFacilityLoading, false);
    assert.equal(client.isFetching(), 0);
    assert.equal(dom.window.document.body.textContent, "No facility");
  } finally {
    await act(async () => root.unmount());
    client.clear();
    if (previousConfig) require.cache[configPath] = previousConfig;
    else delete require.cache[configPath];
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
