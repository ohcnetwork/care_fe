/**
 * Override Framework
 *
 * A non-intrusive system for making React components overrideable.
 *
 * ## Quick Start
 *
 * ### Making a component overrideable:
 * ```tsx
 * import { register } from "@/lib/override";
 *
 * function MyComponent(props: MyProps) {
 *   return <div>Base implementation</div>;
 * }
 *
 * export default register("MyComponent", MyComponent);
 * ```
 *
 * ### Adding an override:
 * ```tsx
 * import { addOverride } from "@/lib/override";
 *
 * addOverride("MyComponent", {
 *   component: CustomMyComponent,
 *   condition: { page: "admin" },
 *   priority: 10,
 * });
 * ```
 *
 * ### Setting up the provider (in App.tsx):
 * ```tsx
 * import { OverrideProvider } from "@/lib/override";
 *
 * function App() {
 *   return (
 *     <OverrideProvider context={{ userRole: user?.role }}>
 *       <AppRoutes />
 *     </OverrideProvider>
 *   );
 * }
 * ```
 *
 * Federated plugs cannot import from this module directly. They register via
 * `window.__careOverrides.addComponent(key, { component, condition?, … })`,
 * which is wired up by `./bridge` (imported here as a side effect).
 */

// Install the `window.__careOverrides` bridge for federated plugs.
import "./bridge";

// Core API
export { register } from "./register";
export type { RegisteredProps } from "./register";

// Registry functions
export {
  addOverride,
  clearOverrides,
  clearRegistry,
  getEntry,
  getRegisteredKeys,
  registerComponent,
} from "./registry";

// Provider
export {
  OverrideProvider,
  useOverrideContextUpdater,
} from "./OverrideProvider";

// Contexts and hooks
export {
  OverrideContext,
  ResolutionContext,
  StackContext,
  stackToArray,
  useOverrideContext,
  useRenderStack,
  useResolutionMap,
  useResolvedComponent,
} from "./contexts";

// Types
export type {
  AnyProps,
  Override,
  OverrideCondition,
  OverrideContextType,
  OverrideProviderProps,
  Registry,
  RegistryEntry,
  RenderStackNode,
  ResolutionMap,
} from "./types";
