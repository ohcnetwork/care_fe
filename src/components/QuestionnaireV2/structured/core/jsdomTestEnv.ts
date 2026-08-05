/**
 * Shared jsdom bootstrap for this directory's React-hook tests
 * (`useStructuredRows.*.test.ts`). `test:unit` is plain `node --test` with
 * no jsdom/testing-library setup, so the hook tests install a minimal DOM
 * themselves from packages already in `package.json` (`jsdom`,
 * `react-dom/client`, jotai's `createStore`).
 *
 * ORDERING: a test must load this module BEFORE anything that transitively
 * loads `react-dom`, so the DOM globals exist when react-dom's environment
 * detection runs — use a bare side-effect `import "./jsdomTestEnv"` as the
 * file's first import (organize-imports never moves a side-effect import).
 * The globals are scoped to the importing test's own process; each
 * `node --test` file runs isolated.
 */
import { JSDOM } from "jsdom";

export const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

// `Object.assign` throws on `globalThis.navigator` under Node >= 21 — Node
// defines its own experimental `navigator` as a getter-only accessor
// property, which a plain assignment can't overwrite. `defineProperty`
// replaces the descriptor outright instead of going through `[[Set]]`.
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  requestAnimationFrame: (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number,
  cancelAnimationFrame: (id: number) => clearTimeout(id),
})) {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

// Tells React's `act()` it's allowed to flush effects/renders synchronously
// instead of warning that "the current testing environment is not
// configured to support act()".
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Gives an effect cascade (render → passive effects → atom write →
 * re-render, plus any deferred microtask) `turns` real macrotask turns to
 * settle. A single synchronous `act(() => {...})` is not enough in
 * practice — a hook's passive effects and jotai's store-driven re-render
 * can land on different flush passes under jsdom/Node's scheduler — so
 * call this inside `act(async () => ...)` with a generous turn count
 * rather than assuming a single pass converges.
 */
export async function flushTurns(turns: number): Promise<void> {
  for (let i = 0; i < turns; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
