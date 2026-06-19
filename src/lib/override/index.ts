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
 * ### For federated plugs
 *
 * Plugs run in their own module graph and cannot import this file. They
 * register through the global bridge instead:
 *
 *     window.__careOverrides.addComponent(key, { component, condition?, … })
 *
 * The bridge below installs that global at host bootstrap.
 */

// Side-effect import: installs `window.__careOverrides` so federated plugs
// can reach the registry. Must run before any plug manifest is evaluated.
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
