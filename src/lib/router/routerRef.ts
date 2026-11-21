import type { AnyRouter } from "@tanstack/react-router";

/**
 * Holds the app router so modules that run before `src/router.tsx` (such as
 * the `navigate` helper) can reach it without an import cycle.
 */
let current: AnyRouter | undefined;

export function setRouter(router: AnyRouter) {
  current = router;
}

export function getRouter(): AnyRouter {
  if (!current) {
    throw new Error("The app router is not created yet.");
  }
  return current;
}
