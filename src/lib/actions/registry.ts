import type {
  ActionDefinition,
  ActionDescriptor,
  ActionRunResult,
  ActionScope,
} from "./types";

/**
 * Host action registry.
 *
 * Federated plugins (the Scribe agent first) used to receive a page's raw
 * state and its setter across the boundary — unvalidated, unscoped, and
 * shaped like whatever the page happened to hold that week. They receive
 * descriptors and an `invoke` callback instead: the host owns the effect,
 * so every write goes through one validate → audit → apply choke point.
 *
 * Mechanics mirror `lib/override/registry.ts` (and
 * `QuestionnaireV2/structured/pluginRegistry.ts`): a module-level Map, a
 * version counter plus a listener Set so React views can
 * `useSyncExternalStore` on it, and a per-registration cleanup closure that
 * only removes the entry it installed.
 *
 * The module has no runtime imports, so nothing pays to reference it.
 */
const actions = new Map<string, ActionDefinition<unknown>>();
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/**
 * Register an action; returns its cleanup closure. Registering an id that
 * is already taken replaces it (a caller re-registers whenever its inputs
 * change), and the superseded registration's cleanup becomes a no-op
 * thanks to the identity check below.
 */
export function registerAction<TInput>(
  definition: ActionDefinition<TInput>,
): () => void {
  // The store is keyed by id, not by input type: `run` is contravariant in
  // TInput, so no supertype holds every definition. `invokeAction` is the
  // only reader and it only ever passes `run` what `schema` just produced,
  // which is exactly TInput.
  const stored = definition as ActionDefinition<unknown>;
  actions.set(definition.id, stored);
  notify();
  return () => {
    if (actions.get(definition.id) === stored) {
      actions.delete(definition.id);
      notify();
    }
  };
}

/** Whether an action belongs to the record the caller is looking at. Keys
 *  the definition leaves unset are unconstrained; keys it sets must match
 *  exactly. */
function scopeMatches(
  actionScope: ActionScope,
  callerScope: ActionScope,
): boolean {
  return (
    (!actionScope.patientId ||
      actionScope.patientId === callerScope.patientId) &&
    (!actionScope.encounterId ||
      actionScope.encounterId === callerScope.encounterId)
  );
}

/** The descriptors a caller in this scope may use — what crosses the
 *  federation boundary. Never leaks `run`, `schema` or `scope`. */
export function listActions(scope: ActionScope): ActionDescriptor[] {
  const descriptors: ActionDescriptor[] = [];
  for (const definition of actions.values()) {
    if (!scopeMatches(definition.scope, scope)) continue;
    descriptors.push({
      id: definition.id,
      description: definition.description,
      parameters: definition.parameters,
    });
  }
  return descriptors;
}

/**
 * The single path from a plugin into host state: resolve, scope-check,
 * validate, audit, then run. Never throws — a caller across the federation
 * boundary gets a result object either way, including for an action that
 * throws on its way through.
 */
export async function invokeAction(
  id: string,
  input: unknown,
  scope: ActionScope,
): Promise<ActionRunResult> {
  const definition = actions.get(id);
  if (!definition) return { ok: false, error: `Unknown action: ${id}` };
  if (!scopeMatches(definition.scope, scope)) {
    return { ok: false, error: `Action ${id} is not available in this scope` };
  }
  const parsed = definition.schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: `Invalid input: ${parsed.error.message}` };
  }
  // Audit stub. Every agent-driven write to clinical state is meant to be
  // recorded server-side; that endpoint (`POST /api/v1/action_audit/`) is a
  // deferred follow-up on the plugin-action-registry decision. Until it
  // exists this is the one place that has to change — and it logs the
  // action and its scope only, never the values, so a console transcript
  // carries no record content.
  console.debug("[actions] invoke", { id, scope });
  try {
    return await definition.run(parsed.data);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function subscribeToActions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Monotonic counter — the `useSyncExternalStore` snapshot, so a view that
 *  lists actions re-renders when the set changes. */
export function getActionsVersion(): number {
  return version;
}
