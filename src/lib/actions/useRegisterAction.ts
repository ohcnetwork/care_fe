import { useEffect } from "react";

import { registerAction } from "./registry";
import type { ActionDefinition } from "./types";

/**
 * Register an action for as long as the component is mounted. `null` when
 * the page is not in a state that can serve the action (no patient in
 * scope, data still loading) — registering nothing is the correct answer
 * there, not registering something that fails on every call.
 *
 * Callers must `useMemo` the definition: its identity is the re-register
 * trigger, so an inline object literal would churn the registry on every
 * render.
 */
export function useRegisterAction<TInput>(
  definition: ActionDefinition<TInput> | null,
) {
  useEffect(() => {
    if (!definition) return;
    return registerAction(definition);
  }, [definition]);
}
