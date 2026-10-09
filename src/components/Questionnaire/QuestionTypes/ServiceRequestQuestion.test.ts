import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import type { ResponseValue } from "@/types/questionnaire/form";

test("selecting the same activity slug in another facility waits for that facility's definition", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", {
    url: "http://localhost",
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    HTMLElement: dom.window.HTMLElement,
    MutationObserver: dom.window.MutationObserver,
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

  const require = createRequire(import.meta.url);
  const previousModules = new Map<string, NodeJS.Module | undefined>();
  const user = { id: "clinician", username: "clinician" };
  // Keep the real widget, query cache, API client and selection effect. The
  // picker and unrelated dialogs are UI boundaries outside this regression.
  const modules: [string, unknown][] = [
    [
      "@careConfig",
      {
        apiUrl: "http://localhost:9000",
        decimal: { precision: 20, rounding: 4, accountingPrecision: 2 },
      },
    ],
    ["@/hooks/useAuthUser", () => user],
    [
      "@/components/Common/ResourceDefinitionCategoryPicker",
      {
        ResourceDefinitionCategoryPicker: (props: {
          onValueChange: (definition: { slug: string }) => void;
        }) =>
          createElement(
            "button",
            {
              onClick: () => props.onValueChange({ slug: "shared-slug" }),
            },
            "Select activity",
          ),
      },
    ],
    ["@/components/Common/UserSelector", () => null],
    ["@/components/Questionnaire/ValueSetSelect", () => null],
    ["@/components/Questionnaire/ManageResponseTemplatesSheet", () => null],
    [
      "@/components/Questionnaire/AddToTemplateDialog",
      { AddToTemplateDialog: () => null },
    ],
  ];
  for (const [path, exports] of modules) {
    const modulePath = require.resolve(path);
    previousModules.set(modulePath, require.cache[modulePath]);
    const module = new Module(modulePath);
    module.exports = exports;
    module.loaded = true;
    require.cache[modulePath] = module;
  }
  const previousFetch = globalThis.fetch;
  let releaseSecondFacility!: () => void;
  const secondFacilityResponse = new Promise<void>((resolve) => {
    releaseSecondFacility = resolve;
  });
  const fetchedFacilities: string[] = [];
  globalThis.fetch = async (input) => {
    const facility = new URL(String(input)).pathname.split("/")[4];
    fetchedFacilities.push(facility);
    if (facility === "facility-b") await secondFacilityResponse;
    return Response.json({
      slug: "shared-slug",
      title: `Activity for ${facility}`,
      classification: "laboratory",
      code: { code: facility, display: facility, system: "test" },
      body_site: null,
      locations: [{ id: `${facility}-location` }],
    });
  };
  const { ServiceRequestQuestion } = await import("./ServiceRequestQuestion");
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources: {}, initAsync: false });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const updates: ResponseValue[][] = [];
  const render = async (facilityId: string) => {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            I18nextProvider,
            { i18n },
            createElement(ServiceRequestQuestion, {
              key: facilityId,
              facilityId,
              encounterId: `${facilityId}-encounter`,
              question: {
                id: "service",
                link_id: "service",
                text: "Service request",
                type: "structured",
                structured_type: "service_request",
              },
              questionnaireResponse: {
                question_id: "service",
                link_id: "service",
                structured_type: "service_request",
                values: [],
              },
              updateQuestionnaireResponseCB: (values) => updates.push(values),
              disabled: false,
              errors: [],
            }),
          ),
        ),
      );
    });
  };
  const selectActivity = async () => {
    const button = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Select activity",
    );
    assert.ok(button);
    await act(async () => button.click());
  };
  const settleUntil = async (ready: () => boolean) => {
    for (let attempt = 0; attempt < 100 && !ready(); attempt++) {
      // TanStack delivers observer notifications on its scheduler, after the
      // deferred fetch resolves. Flush those updates through React's act.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
      });
    }
    assert.ok(ready(), "Expected query observer update");
  };
  try {
    await render("facility-a");
    await selectActivity();
    await settleUntil(() => updates.length === 1);
    const first = updates[0][0];
    assert.ok(first.type === "service_request");
    assert.equal(
      first.value?.[0].service_request.title,
      "Activity for facility-a",
    );

    updates.length = 0;
    await render("facility-b");
    await selectActivity();
    await settleUntil(() => fetchedFacilities.includes("facility-b"));
    assert.equal(
      updates.length,
      0,
      "cached data from facility A must not create a request in facility B",
    );
    releaseSecondFacility();
    await settleUntil(() => updates.length === 1);
    const second = updates[0][0];
    assert.ok(second.type === "service_request");
    assert.equal(second.value?.[0].encounter, "facility-b-encounter");
    assert.equal(
      second.value?.[0].service_request.title,
      "Activity for facility-b",
    );
    assert.equal(second.value?.[0].service_request.code?.code, "facility-b");
    assert.deepEqual(second.value?.[0].service_request.locations, [
      "facility-b-location",
    ]);
  } finally {
    releaseSecondFacility();
    await act(async () => root.unmount());
    client.clear();
    globalThis.fetch = previousFetch;
    dom.window.close();
    for (const [path, module] of previousModules) {
      if (module) require.cache[path] = module;
      else delete require.cache[path];
    }
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
