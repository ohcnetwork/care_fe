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
 *  federation boundary. Never leaks `run`, `schema` or `scope`, and copies
 *  the parameter map on the way out: what a plugin receives is its own to
 *  hold, and mutating it must not reach the registered definition. */
export function listActions(scope: ActionScope): ActionDescriptor[] {
  const descriptors: ActionDescriptor[] = [];
  for (const definition of actions.values()) {
    if (!scopeMatches(definition.scope, scope)) continue;
    descriptors.push({
      id: definition.id,
      description: definition.description,
      parameters: Object.fromEntries(
        Object.entries(definition.parameters).map(([name, parameter]) => [
          name,
          { ...parameter },
        ]),
      ),
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
  if (!definition) {
    audit(id, scope, "unknown-action");
    return { ok: false, error: `Unknown action: ${id}` };
  }
  if (!scopeMatches(definition.scope, scope)) {
    audit(id, scope, "scope-rejected");
    return { ok: false, error: `Action ${id} is not available in this scope` };
  }
  const parsed = definition.schema.safeParse(input);
  if (!parsed.success) {
    audit(id, scope, "schema-rejected");
    // Issue-by-issue rather than `ZodError.message` (a JSON dump): the
    // reader is a model correcting its own call.
    const problems = parsed.error.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("; ");
    return { ok: false, error: `Invalid input: ${problems}` };
  }
  audit(id, scope, "invoked");
  try {
    const result = await definition.run(parsed.data);
    audit(id, scope, result.ok ? "ok" : "failed");
    return result;
  } catch (error) {
    audit(id, scope, "threw");
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Audit stub — every attempt, accepted or rejected, with its outcome.
 * Agent-driven writes to clinical state are meant to be recorded
 * server-side; that endpoint (`POST /api/v1/action_audit/`) is a deferred
 * follow-up on the plugin-action-registry decision, and this is the one
 * place that has to change when it lands.
 *
 * It records the action, the scope and the outcome — never the input or
 * the result — so a console transcript carries no record content.
 */
function audit(id: string, scope: ActionScope, outcome: string) {
  console.debug("[actions]", outcome, { id, scope });
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
