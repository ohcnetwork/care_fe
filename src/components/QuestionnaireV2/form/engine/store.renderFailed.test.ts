import assert from "node:assert/strict";
import { test } from "node:test";

import { Provider, createStore } from "jotai";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { ResponseRowProvider } from "./responseScope";
import {
  renderFailedKey,
  responsesAtom,
  structuredRenderFailedAtom,
  useClearStructuredRenderFailed,
  useMarkStructuredRenderFailed,
  useQuestionResponse,
} from "./store";

test("render-failed marks are keyed per row and dropped when rows change", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>");
  const globals = {
    window: dom.window,
    document: dom.window.document,
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

  const store = createStore();
  const row = (value: string) => [
    {
      question_id: "child",
      link_id: "child",
      structured_type: "encounter" as const,
      values: [{ type: "string" as const, value }],
    },
  ];
  store.set(responsesAtom, {
    group: {
      question_id: "group",
      link_id: "group",
      structured_type: null,
      values: [],
      sub_results: [row("a"), row("b")],
    },
    root: {
      question_id: "root",
      link_id: "root",
      structured_type: "encounter",
      values: [],
    },
  });

  function Slot({ id }: { id: string }) {
    const mark = useMarkStructuredRenderFailed(id);
    const clear = useClearStructuredRenderFailed(id);
    return createElement(
      "span",
      null,
      createElement("button", { className: "mark", onClick: () => mark() }),
      createElement("button", { className: "clear", onClick: () => clear() }),
    );
  }
  function Group() {
    const [response, update] = useQuestionResponse("group");
    const rows = response.sub_results ?? [];
    return createElement(
      "div",
      null,
      createElement("button", {
        className: "remove",
        onClick: () => update({ sub_results: rows.slice(1) }),
      }),
      createElement("button", {
        className: "edit",
        onClick: () => update({ values: [{ type: "string", value: "x" }] }),
      }),
      rows.map((_, rowIndex) =>
        createElement(ResponseRowProvider, {
          key: rowIndex,
          groupId: "group",
          rowIndex,
          children: createElement(Slot, { id: "child" }),
        }),
      ),
    );
  }
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const click = (selector: string, index = 0) =>
    act(async () =>
      (
        container.querySelectorAll<HTMLButtonElement>(selector)[index] as
          HTMLButtonElement | undefined
      )?.click(),
    );
  const rowKey = (rowIndex: number) =>
    renderFailedKey("child", [{ questionId: "group", rowIndex }]);

  try {
    await act(async () => {
      root.render(
        createElement(
          Provider,
          { store },
          createElement(Slot, { id: "root" }),
          createElement(Group),
        ),
      );
    });
    await click(".mark", 0);
    await click(".mark", 2);
    assert.deepEqual(
      [...store.get(structuredRenderFailedAtom)].sort(),
      [renderFailedKey("root", []), rowKey(1)].sort(),
    );
    await click(".clear", 1);
    assert.equal(store.get(structuredRenderFailedAtom).has(rowKey(1)), true);
    await click(".clear", 2);
    assert.equal(store.get(structuredRenderFailedAtom).has(rowKey(1)), false);

    await click(".mark", 1);
    await click(".mark", 2);
    const before = store.get(structuredRenderFailedAtom);
    await click(".edit");
    assert.equal(store.get(structuredRenderFailedAtom), before);
    await click(".remove");
    assert.deepEqual(
      [...store.get(structuredRenderFailedAtom)],
      [renderFailedKey("root", [])],
    );
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
