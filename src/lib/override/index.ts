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
 */

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

// API hook overrides — let plugs replace `useApiMutation` / `useApiQuery`
// options for a given route.
export {
  addMutationOverride,
  addQueryOverride,
  clearOverrides as clearApiOverrides,
  getMutationOverride,
  getQueryOverride,
} from "./api";
export type {
  ApiOverrideContext,
  MutationOverride,
  QueryOverride,
} from "./api";

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
