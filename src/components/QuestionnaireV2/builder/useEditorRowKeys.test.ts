import assert from "node:assert/strict";
import { test } from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";

import { useEditorRowKeys } from "./useEditorRowKeys";

test("editing duplicate rows preserves their DOM state across moves and deletion", async () => {
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

  function Harness({ scope }: { scope: string }) {
    const [values, setValues] = useState(["duplicate", "duplicate", "third"]);
    const { rowKeys, removeRowKey, moveRowKey } = useEditorRowKeys(
      scope,
      values.length,
    );
    return createElement(
      "div",
      null,
      ...values.map((value, index) =>
        createElement(
          "div",
          { key: rowKeys[index] },
          createElement("input", { defaultValue: value }),
          createElement("span", null, value),
          createElement("button", {
            "data-action": "edit",
            onClick: () =>
              setValues(values.map((v, i) => (i === index ? "edited" : v))),
          }),
          createElement("button", {
            "data-action": "remove",
            onClick: () => {
              removeRowKey(index);
              setValues(values.filter((_, i) => i !== index));
            },
          }),
          createElement("button", {
            "data-action": "move-up",
            disabled: index === 0,
            onClick: () => {
              const next = [...values];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              moveRowKey(index, index - 1);
              setValues(next);
            },
          }),
        ),
      ),
      createElement("button", {
        "data-action": "add",
        onClick: () => setValues([...values, "duplicate"]),
      }),
    );
  }

  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const inputs = () => [...container.querySelectorAll("input")];
  const click = async (action: string, index = 0) => {
    await act(async () => {
      container
        .querySelectorAll<HTMLButtonElement>(`[data-action='${action}']`)
        [index].click();
    });
  };

  try {
    await act(async () => root.render(createElement(Harness, { scope: "q1" })));
    const [first, second, third] = inputs();
    // Simulate an uncommitted buffer that is deliberately absent from the
    // parent values, as in numeric and JSON editors.
    second.value = "0.";
    await click("edit", 1);
    assert.equal(inputs()[1], second);
    assert.equal(inputs()[1].value, "0.");

    await click("remove");
    assert.deepEqual(inputs(), [second, third]);
    assert.equal(first.isConnected, false);
    assert.equal(inputs()[0].value, "0.");

    await click("move-up", 1);
    assert.deepEqual(inputs(), [third, second]);
    assert.equal(inputs()[1].value, "0.");

    await click("add");
    assert.equal(inputs()[0], third);
    assert.equal(inputs()[1], second);
    assert.ok(![first, second, third].includes(inputs()[2]));
    assert.equal(inputs()[2].value, "duplicate");

    // The shared inspector switches questions without unmounting the
    // editor. Equal row counts must not carry buffers into the new scope.
    await act(async () => root.render(createElement(Harness, { scope: "q2" })));
    assert.equal(second.isConnected, false);
    assert.equal(inputs()[1].value, "edited");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
