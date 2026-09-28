/**
 * Host action registry — the sanctioned way for a federated plugin to
 * change host state.
 *
 * A page registers zod-validated, scope-gated actions while it is mounted
 * and hands the plugin two props: the descriptors it may use, and an
 * `invoke` callback bound to the page's scope. Descriptors and the
 * callback cross the boundary as PROPS (React is a shared singleton) —
 * never as a window global.
 *
 * ```tsx
 * const definition = useMemo<ActionDefinition<Input> | null>(() => ({ … }), [deps]);
 * useRegisterAction(definition);
 * <PLUGIN_Component __name="Scribe" actions={descriptors} invoke={invoke} />
 * ```
 */
export {
  getActionsVersion,
  invokeAction,
  listActions,
  registerAction,
  subscribeToActions,
} from "./registry";
export type {
  ActionDefinition,
  ActionDescriptor,
  ActionParameterDescriptor,
  ActionRunResult,
  ActionScope,
} from "./types";
export { useRegisterAction } from "./useRegisterAction";
