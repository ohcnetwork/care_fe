import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

test("department edits wait for the saved IDs and failed saves preserve the prior selection", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", {
    url: "http://localhost",
  });
  const requests: {
    url: string;
    body?: string;
    resolve: (response: Response) => void;
  }[] = [];
  const globals = {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: (url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((resolve) => {
        requests.push({
          url: String(url),
          body: init?.body?.toString(),
          resolve,
        });
      }),
  };
  const previousGlobals = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { value, configurable: true });
  const require = createRequire(import.meta.url);
  const restoredModules: {
    path: string;
    previous: NodeJS.Module | undefined;
  }[] = [];
  const stubModule = (specifier: string, exports: unknown) => {
    const path = require.resolve(specifier);
    restoredModules.push({ path, previous: require.cache[path] });
    const module = new Module(path);
    module.exports = exports;
    module.loaded = true;
    require.cache[path] = module;
  };
  stubModule("@careConfig", { apiUrl: "http://localhost:9000" });
  let select!: (ids: string[]) => void;
  stubModule(
    "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector",
    ({
      value,
      onChange,
    }: {
      value: string[];
      onChange: (ids: string[]) => void;
    }) => {
      select = onChange;
      return createElement(
        "button",
        { type: "button", onClick: () => onChange([...value, "new"]) },
        value.join(","),
      );
    },
  );
  const { ValueSetOrganizationsField } =
    await import("./ValueSetOrganizationsField");
  const i18n = createInstance();
  await i18n.init({ lng: "en", initAsync: false, resources: {} });
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(["valueset", "set", "facility-organizations"], {
    results: [{ id: "saved", name: "Saved" }],
  });
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const settle = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  };
  const button = () => container.querySelector("button")!;
  try {
    await act(async () =>
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            I18nextProvider,
            { i18n },
            createElement(ValueSetOrganizationsField, {
              facilityId: "facility",
              valuesetId: "set",
              canWrite: true,
            }),
          ),
        ),
      ),
    );
    assert.equal(button().textContent, "saved");
    assert.equal(button().matches(":disabled"), false);
    await act(async () => button().click());
    await settle();
    assert.equal(requests.length, 1);
    assert.deepEqual(JSON.parse(requests[0].body!), {
      facility_organizations: ["saved", "new"],
    });
    assert.equal(button().matches(":disabled"), true);
    await act(async () => select(["saved", "racing"]));
    assert.equal(
      requests.length,
      1,
      "portaled controls must not start overlapping saves",
    );

    await act(async () => requests[0].resolve(Response.json({})));
    await settle();
    assert.equal(requests.length, 2);
    assert.match(requests[1].url, /get_facility_organizations/);
    assert.equal(
      button().matches(":disabled"),
      true,
      "wait for authoritative IDs after saving",
    );
    await act(async () =>
      requests[1].resolve(
        Response.json({
          results: [
            { id: "saved", name: "Saved" },
            { id: "new", name: "New" },
          ],
        }),
      ),
    );
    await settle();
    assert.equal(button().textContent, "saved,new");
    assert.equal(button().matches(":disabled"), false);

    await act(async () => select(["new"]));
    await settle();
    assert.equal(requests.length, 3);
    await act(async () =>
      requests[2].resolve(
        Response.json({ detail: "Save rejected" }, { status: 400 }),
      ),
    );
    await settle();
    assert.equal(button().textContent, "saved,new");
    assert.equal(button().matches(":disabled"), false);
  } finally {
    await act(async () => root.unmount());
    client.clear();
    dom.window.close();
    for (const { path, previous } of restoredModules) {
      if (previous) require.cache[path] = previous;
      else delete require.cache[path];
    }
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
