import assert from "node:assert/strict";
import { test } from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, useReducer } from "react";
import { createRoot } from "react-dom/client";

import {
  BuilderState,
  builderReducer,
} from "@/components/QuestionnaireV2/builder/builderReducer";

import { useStudioSelection } from "./useStudioSelection";

test("studio selection preserves reveal intent and follows question-creating actions", async () => {
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
  const initialState: BuilderState = {
    questions: [
      {
        id: "group",
        link_id: "group",
        text: "Group",
        type: "group",
        questions: [
          { id: "child", link_id: "child", text: "Child", type: "string" },
        ],
      },
      { id: "tail", link_id: "tail", text: "Tail", type: "string" },
    ],
    actions: [],
    selectedId: "child",
    dirty: false,
  };
  let selection: ReturnType<typeof useStudioSelection>;
  function Harness() {
    const [state, dispatch] = useReducer(builderReducer, initialState);
    selection = useStudioSelection(state, dispatch);
    return null;
  }

  const root = createRoot(dom.window.document.getElementById("root")!);
  try {
    await act(async () => root.render(createElement(Harness)));
    assert.equal(selection!.panel, "question");
    assert.equal(selection!.selectedNumber, "1.1.");
    const handlers = {
      dispatch: selection!.studioDispatch,
      select: selection!.selectQuestion,
      reveal: selection!.revealQuestion,
      revealAction: selection!.revealAction,
    };
    // Unrelated metadata/sidebar renders must not replace the callbacks
    // used by the canvas's memoized editor context.
    await act(async () => root.render(createElement(Harness)));
    assert.equal(selection!.studioDispatch, handlers.dispatch);
    assert.equal(selection!.selectQuestion, handlers.select);
    assert.equal(selection!.revealQuestion, handlers.reveal);
    assert.equal(selection!.revealAction, handlers.revealAction);

    await act(async () => selection.revealAction(2));
    assert.equal(selection!.panel, "actions");
    assert.equal(selection!.openActionIndex, 2);
    assert.equal(selection!.selectedQuestion?.id, "child");

    // Canvas and mobile navigation select without requesting a scroll.
    await act(async () => selection.selectQuestion("tail"));
    assert.equal(selection!.panel, "question");
    assert.equal(selection!.selectedNumber, "2.");
    assert.equal(selection!.scrollRequest, null);

    // Repeated outline/issue clicks must reveal even an already-selected row.
    await act(async () => selection.revealQuestion("child"));
    assert.deepEqual(selection!.scrollRequest, { id: "child", nonce: 1 });
    await act(async () => selection.revealQuestion("child"));
    assert.deepEqual(selection!.scrollRequest, { id: "child", nonce: 2 });
    const previousScrollRequest = selection!.scrollRequest;
    await act(async () => selection.selectQuestion("tail"));
    assert.equal(selection!.scrollRequest, previousScrollRequest);

    await act(async () => selection.setInspectorTarget("form"));
    await act(async () =>
      selection.studioDispatch({ type: "addQuestion", parentId: null }),
    );
    assert.equal(selection!.panel, "question");
    assert.equal(selection!.selectedNumber, "3.");

    await act(async () => selection.setInspectorTarget("form"));
    await act(async () =>
      selection.studioDispatch({ type: "duplicateQuestion", id: "child" }),
    );
    assert.equal(selection!.panel, "question");
    assert.equal(selection!.selectedQuestion?.text, "Child (copy)");
    assert.notEqual(selection!.selectedQuestion?.id, "child");

    await act(async () => selection.revealAction(0));
    await act(async () =>
      selection.studioDispatch({
        type: "replaceAll",
        questions: [
          {
            id: "imported",
            link_id: "imported",
            text: "Imported",
            type: "string",
          },
        ],
      }),
    );
    assert.equal(selection!.panel, "question");
    assert.equal(selection!.selectedQuestion?.id, "imported");

    await act(async () =>
      selection.studioDispatch({ type: "removeQuestions", ids: ["imported"] }),
    );
    assert.equal(selection!.panel, "form");
    assert.equal(selection!.selectedQuestion, undefined);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
