# Component Override Framework

> **Source of truth:** `src/lib/override/` — see `index.ts`, `register.ts`,
> `registry.ts`, `bridge.ts`, `contexts.ts`, `OverrideProvider.tsx`, and
> `types.ts`.

## Goal

A **non-intrusive override system** enabling plugins to replace or wrap any
registered React component — without changing how components are consumed.

Key properties:

- Components remain **pure**: no override-awareness in their implementation
- Overrides are **context-aware** (route, user role, facility type, render stack)
- Performance is **near O(1)** at render time for most components
- Plugin bugs **cannot crash the host** (error boundary fallback)

---

## Core API

### `register(key, BaseComponent)`

Wraps a component to make it overrideable. Consumers use the component normally.

```tsx
import { register } from "@/lib/override";

function PatientCard(props: PatientCardProps) {
  return <div>Base Card</div>;
}

export default register("PatientCard", PatientCard);
```

Usage is unchanged:

```tsx
<PatientCard patient={patient} />
```

**What it does under the hood:**

1. Registers the component in the global `registry` (a `Map<string, RegistryEntry>`)
2. Returns a wrapper that, at render time:
   - If no overrides exist → renders `BaseComponent` directly
   - If overrides exist but none use stack conditions → **fast path**: looks up the precomputed `ResolutionMap`
   - If stack conditions are present → **stack-aware path**: creates a linked-list stack node and resolves dynamically
3. Wraps override renders in an `OverrideErrorBoundary` — if the override throws, falls back to a safe message

### `addOverride(key, override)`

Registers an override for a component. Returns a cleanup function.

```tsx
import { addOverride } from "@/lib/override";

const cleanup = addOverride("PatientCard", {
  component: CustomPatientCard,
  condition: { page: "admin", userRole: "doctor" },
  priority: 10,
  description: "Custom card for admin doctors",
});
```

Overrides are sorted by `priority` (highest first). The first override whose
`condition` matches the current context wins.

### `OverrideProvider`

Placed near the app root; provides resolution context to all registered
components.

```tsx
import { OverrideProvider } from "@/lib/override";

function App() {
  return (
    <OverrideProvider context={{ userRole: user?.role }}>
      <AppRoutes />
    </OverrideProvider>
  );
}
```

The provider:

1. Reads the current route via `usePath()` from raviger
2. Extracts a `page` identifier from the route path
3. Merges external context (role, facility type, custom values)
4. Computes a `ResolutionMap` — a pre-resolved `Map<key, Component>` for all
   components that don't need stack-based resolution
5. Subscribes to registry changes so the map recomputes when overrides are
   added/removed at runtime

---

## Type Definitions

```ts
interface OverrideContextType {
  page?: string;
  route?: string;
  userRole?: string;
  facilityType?: string;
  custom?: Record<string, unknown>;
}

interface OverrideCondition {
  page?: string | string[];
  userRole?: string | string[];
  facilityType?: string | string[];
  stackPath?: string[];              // match component ancestry
  custom?: (ctx: OverrideContextType) => boolean;
}

interface Override<P = AnyProps> {
  component: ComponentType<P>;
  condition?: OverrideCondition;     // omit = always match
  priority?: number;                 // higher wins (default 0)
  description?: string;
}

interface RegistryEntry<P = AnyProps> {
  base: ComponentType<P>;
  overrides: Override<P>[];
  hasStackConditions: boolean;       // optimization flag
}
```

---

## Resolution Algorithm

### Fast Path (most components)

```
OverrideProvider computes ResolutionMap at context changes:
  for each registry entry without stack conditions:
    find first override whose condition matches context
    store in Map<key, ResolvedComponent>

RegisteredComponent renders:
  resolutionMap.get(key) || BaseComponent → render
```

Cost: **O(1)** per component render (map lookup).

### Stack-Aware Path (opt-in via `stackPath` condition)

```
RegisteredComponent renders:
  create stack node { name: key, parent: parentStack }
  walk overrides checking condition + stackPath match
  render resolved component within StackContext.Provider
```

Stack matching uses subsequence matching — `["PatientHome", "PatientCard"]`
matches any render tree where `PatientCard` is a descendant of `PatientHome`.

Cost: **O(depth × overrides)** — only activated for components with
`hasStackConditions: true`.

---

## Federated Plugin Bridge

Plugins loaded via Module Federation run in their own module graph and cannot
import `@/lib/override` directly. The bridge (`bridge.ts`) exposes:

```ts
window.__careOverrides.addComponent(key, { component, condition?, priority? })
```

This global is installed as a side effect when `src/lib/override/index.ts` is
first imported (before any plugin manifest evaluates).

---

## `__base` Prop Injection

When an override is rendered, the wrapper injects `__base` pointing to the
original base component. This lets overrides selectively render the original:

```tsx
function CustomPatientCard({ __base: Base, ...props }) {
  if (props.compact) return <Base {...props} />;
  return <div className="custom-wrapper"><Base {...props} /></div>;
}
```

---

## Error Isolation

Each override render is wrapped in `OverrideErrorBoundary`. If the override
throws, the boundary:

1. Logs the error to the console with the component key
2. Renders a minimal fallback message indicating which plugin override failed

The host app continues running normally.

---

## Performance Summary

| Operation                   | Cost                        |
| --------------------------- | --------------------------- |
| Resolution map computation  | O(registry size × overrides) — runs once per context change |
| Component render (fast)     | O(1) map lookup             |
| Stack node creation         | O(1) linked-list append     |
| Stack-aware resolution      | O(depth) — rare             |

---

## Debugging

```ts
import { getRegisteredKeys, getEntry } from "@/lib/override";

// List all registered component keys
console.log(getRegisteredKeys());

// Inspect a specific entry
console.log(getEntry("PatientCard"));
```

Registered components also expose metadata:

```ts
RegisteredComponent.__override_key__;      // "PatientCard"
RegisteredComponent.__base_component__;    // original function
RegisteredComponent.displayName;           // "Registered(PatientCard)"
```
