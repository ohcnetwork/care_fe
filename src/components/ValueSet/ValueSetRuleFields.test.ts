import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createInstance } from "i18next";
import { JSDOM } from "jsdom";
import { act, createElement, Fragment, useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import {
  INSTANCE_VALUESET_SCOPE,
  TERMINOLOGY_SYSTEMS,
  ValueSetRead,
  ValueSetStatus,
} from "@/types/valueSet/valueSet";

import type { ValueSetFormData } from "./valueSetFormTypes";

test("rule edits stay local and deleting or restoring a rule preserves its siblings", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", {
    pretendToBeVisual: true,
  });
  const lookups: {
    body: { code: string; system: string };
    signal: AbortSignal | null | undefined;
    resolve: (response: Response) => void;
  }[] = [];
  const globals = {
    window: dom.window,
    localStorage: { getItem: () => null },
    fetch: (_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((resolve) => {
        lookups.push({
          body: JSON.parse(String(init?.body)) as {
            code: string;
            system: string;
          },
          signal: init?.signal,
          resolve,
        });
      }),
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    HTMLFormElement: dom.window.HTMLFormElement,
    DocumentFragment: dom.window.DocumentFragment,
    MutationObserver: dom.window.MutationObserver,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
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

  // The real API client reads Vite's configuration at module load. This
  // instance-level editor does not fetch; keep only the inert API origin.
  const require = createRequire(import.meta.url);
  const configPath = require.resolve("@careConfig");
  const previousConfig = require.cache[configPath];
  const configModule = new Module(configPath);
  configModule.exports = { apiUrl: "http://localhost:9000" };
  configModule.loaded = true;
  require.cache[configPath] = configModule;

  const { Form } = await import("@/components/ui/form");
  const { ValueSetFormErrors } = await import("./ValueSetFormErrors");
  const { ValueSetRuleFields } = await import("./ValueSetRuleFields");
  const { useValueSetEditorForm } = await import("./useValueSetEditorForm");
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    initAsync: false,
    resources: {
      en: {
        translation: {
          valueset_include_rule: "Include rule {{number}}",
          valueset_remove_rule: "Remove {{rule}}",
          valueset_concept_count: "{{count}} concepts",
        },
      },
    },
  });
  const initialData: ValueSetRead = {
    id: "existing",
    name: "Existing system value set",
    slug: "an-existing-system-slug-longer-than-the-create-limit",
    description: "",
    status: ValueSetStatus.ACTIVE,
    is_system_defined: true,
    disable_composition: false,
    compose: {
      include: ["first", "second"].map((code) => ({
        system: TERMINOLOGY_SYSTEMS.LOINC,
        version: null,
        concept: [{ code, display: `${code} display` }],
      })),
      exclude: [],
    },
    created_by: null,
    updated_by: null,
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  let form: ReturnType<typeof useValueSetEditorForm>["form"];
  let renders = 0;
  let focusedIssue: string | undefined;
  function Editor() {
    const editor = useValueSetEditorForm({
      scope: INSTANCE_VALUESET_SCOPE,
      initialData,
    });
    form = editor.form;
    renders++;
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    return createElement(Form<ValueSetFormData>, {
      ...form,
      children: createElement(
        Fragment,
        null,
        createElement(ValueSetFormErrors, {
          control: form.control,
          onFocusIssue: (issue) => {
            focusedIssue = issue.name;
          },
        }),
        createElement(ValueSetRuleFields, {
          form,
          type: "include",
          openIndex,
          onOpenIndexChange: setOpenIndex,
        }),
      ),
    });
  }
  const codeInput = (index: number) => {
    const input = container.querySelector<HTMLInputElement>(
      `[name="compose.include.${index}.concept.0.code"]`,
    );
    assert.ok(input);
    return input;
  };
  const click = async (label: string) => {
    const button = [...container.querySelectorAll("button")].find(
      (element) =>
        element.getAttribute("aria-label") === label ||
        element.textContent === label,
    );
    assert.ok(button, `Missing button: ${label}`);
    await act(async () => button.click());
  };
  try {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(I18nextProvider, { i18n }, createElement(Editor)),
        ),
      );
    });
    assert.equal(form!.formState.isDirty, false);
    assert.equal(form!.getValues("compose.include.0.version"), "");
    assert.deepEqual(form!.getValues("compose.include.0.filter"), []);
    await act(async () => assert.equal(await form!.trigger(), true));

    const beforeEdit = renders;
    const siblingInput = codeInput(1);
    await act(async () => {
      form!.setValue("compose.include.1.concept.0.code", "edited-second");
    });
    assert.equal(codeInput(1).value, "edited-second");
    assert.equal(
      renders,
      beforeEdit,
      "a rule edit must not rerender the form owner",
    );

    await click("Remove Include rule 1");
    assert.equal(
      codeInput(0),
      siblingInput,
      "removal must preserve the sibling DOM input",
    );
    assert.equal(codeInput(0).value, "edited-second");
    assert.equal(form!.getValues("compose.include").length, 1);

    await click("valueset_undo");
    assert.equal(codeInput(0).value, "first");
    assert.equal(
      codeInput(1),
      siblingInput,
      "undo must preserve the sibling DOM input",
    );
    assert.equal(codeInput(1).value, "edited-second");
    assert.equal(form!.getValues("compose.include").length, 2);

    await act(async () => {
      form!.setValue("compose.include.1.concept.0.display", "", {
        shouldValidate: true,
      });
    });
    assert.match(container.textContent ?? "", /valueset_verify_before_saving/);
    const attention = [...container.querySelectorAll("button")].find(
      (button) => button.getAttribute("aria-label") === "Include rule 2",
    );
    assert.match(attention?.textContent ?? "", /valueset_needs_attention/);

    await act(async () => {
      await form!.handleSubmit(() =>
        assert.fail("unverified code must fail validation"),
      )();
    });
    const errorSummary = container.querySelector('[role="alert"]');
    assert.ok(errorSummary);
    assert.match(
      errorSummary.textContent ?? "",
      /valueset_verify_before_saving/,
    );
    const issueButton = errorSummary.querySelector("button");
    assert.ok(issueButton);
    await act(async () => issueButton.click());
    assert.equal(focusedIssue, "compose.include.1.concept.0.display");

    const beforeErrorUpdate = renders;
    await act(async () => {
      form!.setError("compose.include.1.concept.0.display", {
        message: "A more specific validation message",
      });
    });
    assert.match(
      errorSummary.textContent ?? "",
      /A more specific validation message/,
    );
    assert.equal(
      renders,
      beforeErrorUpdate,
      "updating the summary must not rerender the form owner",
    );

    await click("verify code");
    assert.equal(lookups.length, 1);
    assert.equal(lookups[0].body.code, "edited-second");
    await act(async () => {
      form!.setValue("compose.include.1.concept.0.code", "  replacement  ");
    });
    assert.equal(lookups[0].signal?.aborted, true);
    await act(async () => {
      lookups[0].resolve(
        Response.json({ metadata: { display: "Stale result" } }),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(
      form!.getValues("compose.include.1.concept.0.display"),
      "",
      "a late verification must not change an edited code",
    );

    await click("verify code");
    assert.equal(lookups.length, 2);
    assert.equal(lookups[1].body.code, "replacement");
    await act(async () => {
      lookups[1].resolve(
        Response.json({ metadata: { display: "Replacement display" } }),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(
      form!.getValues("compose.include.1.concept.0.code"),
      "replacement",
    );
    assert.equal(
      form!.getValues("compose.include.1.concept.0.display"),
      "Replacement display",
    );
  } finally {
    await act(async () => root.unmount());
    queryClient.clear();
    dom.window.close();
    if (previousConfig) require.cache[configPath] = previousConfig;
    else delete require.cache[configPath];
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
