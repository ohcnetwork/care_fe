# Component Override Framework

> **Source of truth:** `src/lib/override/` — see `index.ts`, `register.ts`,
> `registry.ts`, `bridge.ts`, `contexts.ts`, `OverrideProvider.tsx`, and
> `types.ts`.
>
> **Companion doc:** `care-apps-plugin-overrides.md` covers the build-time
> registration pipeline (`plugins/autoRegisterComponents.ts`, the
> `REACT_MFE_REGISTERED_COMPONENTS` allowlist, and supported export forms) and
> the manifest-level override contract Care Apps declare. This doc focuses on
> the runtime framework in `src/lib/override/`. Read them together.
>
> **Wiring:** `src/PluginEngine.tsx` reads each plugin's `overrides` list and
> calls `addOverride`. A Care App declaring overrides in its manifest is not
> enough — the swap lands in the registry only after PluginEngine runs. Types
> for that list live in `src/pluginTypes.ts`.

## Goal

A **non-intrusive override system** enabling plugins to replace or wrap any
registered React component — without changing how components are consumed.

Key properties:

- Components remain **pure**: no override-awareness in their implementation
- Overrides **can** match on page, user role, facility type, and render stack.
  Today `App.tsx` only fills `route` / `page` from the URL — `userRole` and
  `facilityType` are never set, so conditions on those keys never match.
  `stackPath` (render stack) is implemented but **parent names never land on
  the stack** in CARE today — see Stack-Aware Path
- Performance is **near O(1)** at render time for most components
- A throwing override **does not white-screen the app**. `OverrideErrorBoundary`
  replaces **that component** with a short message; it does **not** render the
  original. Sidebar and other routes keep working (see Error Isolation)

---

## Core API

### `register(key, BaseComponent)`

Wraps a component to make it overrideable. **You normally do not call this by
hand.** At build time `plugins/autoRegisterComponents.ts` rewrites eligible
exported PascalCase components under `src/` (subject to the
`REACT_MFE_REGISTERED_COMPONENTS` allowlist) so the export already calls
`register()`. See `care-apps-plugin-overrides.md` for the transform, allowlist,
supported export forms, and the **named + default** trap. You just write and
consume the component normally:

```tsx
// You write this (one export — default-only is a supported form):
function PatientCard(props: PatientCardProps) {
  return <div>Base Card</div>;
}

export default PatientCard;
```

```tsx
// Idea of the transform (actual emit uses an import alias and a
// `…Registered` binding — see the companion doc):
export default register("PatientCard", PatientCard);

<PatientCard patient={patient} />
```

Empty or unset `REACT_MFE_REGISTERED_COMPONENTS` wraps **nothing**. The
call site must import the **same** export Vite wrapped (named vs default).
If a file has both `export function Foo` / `export const Foo` **and**
`export default Foo`, Vite wraps the named export and **skips** the default
(the name is already marked transformed). A default import then gets the
original component — overrides never run.

Calling `register()` by hand still works. It is always-on (does not need the
allowlist). Put it on the export the call site actually imports. Example:
`PrintInvoice.tsx` uses `export default register("PrintInvoice", PrintInvoiceBase)`
because the router does `import PrintInvoice from "…"`. Renaming the inner
function to `…Base` is optional; it only avoids two public values sharing the
name `PrintInvoice`.

```tsx
export function PrintInvoiceBase(props: PrintInvoiceProps) { /* original */ }

export default register("PrintInvoice", PrintInvoiceBase);
```

`export function PrintInvoice` plus `export default register("PrintInvoice", PrintInvoice)`
also works for a default import — no rename required.

**What it does under the hood:**

1. Registers the component in the global `registry` (a `Map<string, RegistryEntry>`)
2. Returns a wrapper that, at render time:
   - If no overrides exist → renders `BaseComponent` directly
   - If overrides exist but none use stack conditions → **fast path**: looks up the precomputed `ResolutionMap`
   - If this key has a `stackPath` override → **stack-aware path**: this
     sleeve writes its own name onto `StackContext` and resolves. Ancestors
     that took the fast path (or have no overrides) do **not** write their
     names, so parent+child `stackPath` does not match today (see Stack-Aware Path)
3. Wraps override renders in an `OverrideErrorBoundary` — if the override throws,
   that slot shows a short message (not the original component; see Error Isolation)

### `addOverride(key, override)`

Registers an override for a component. Returns a cleanup function.
`PluginEngine` calls this for each manifest `overrides` entry: the string
`component` is the registry key, and `replacement` becomes `override.component`.

```tsx
import { addOverride } from "@/lib/override";

const cleanup = addOverride("PatientCard", {
  component: CustomPatientCard,
  condition: { page: "admin" },
  priority: 10,
  description: "Custom card for admin doctors",
});
```

Omit `condition` to always match. Overrides are sorted by `priority` (highest
first). The first override whose `condition` matches the current context wins.

`page` is the identifier `OverrideProvider` extracts from the URL (see below),
not the full path. `userRole` / `facilityType` only match if those keys are
set on the provider — `App.tsx` does not set them today.

If `register()` has not run yet for that key, `addOverride` still stores the
override on a placeholder entry. The sleeve must exist by render time or the
page never looks at that entry.

`PluginEngine` keeps the cleanup functions and runs them when the plugin list
changes, so stale overrides do not pile up.

### `OverrideProvider`

Placed near the app root; provides resolution context to all registered
components.

```tsx
import { OverrideProvider } from "@/lib/override";

function App() {
  return (
    // Example: pass extra context. App.tsx today uses <OverrideProvider>
    // with no `context` prop — only `route` / `page` from the URL are filled.
    <OverrideProvider context={{ userRole: user?.role }}>
      <AppRoutes />
    </OverrideProvider>
  );
}
```

In `App.tsx`, `OverrideProvider` wraps `AuthUserProvider`. Role is not
available at that spot today even if you wanted to pass `user.role`.

The provider:

1. Reads the current route via `usePath()` from raviger
2. Extracts a `page` identifier: first path segment (`/facilities` →
   `"facilities"`). If the second segment looks like an id (UUID or digits)
   and a third exists, it becomes `first-third`
   (`/facility/<uuid>/patients` → `"facility-patients"`)
3. Merges the optional `context` prop (role, facility type, custom values)
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
  stackPath?: string[];              // match sleeve ancestry (see Stack-Aware Path)
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

A name is appended **only on this path**. Fast-path sleeves and sleeves with
no overrides skip `StackContext.Provider`, so they never appear as parents.

`stackPath: ["LoginHeader"]` can match (the leaf writes itself).
`stackPath: ["FacilitiesPage", "LoginHeader"]` does **not** match today even
when `FacilitiesPage` is registered and really renders `LoginHeader` — the
parent never signed in. Registering the parent (env allowlist or hand
`register()`) is not enough.

The docs-shaped example — subsequence
`["PatientHome", "PatientCard"]` meaning “card under that page” — is the
intended design. It is **not usable in CARE today**. No in-tree Care App
uses `stackPath`.

Cost: **O(overrides × stack depth)** — only activated for components with
`hasStackConditions: true`. `matchCondition` does not look at `stackPath`;
that check happens only on this path.

---

## Federated Plugin Bridge

Plugins loaded via Module Federation run in their own module graph and cannot
import `@/lib/override` directly. Care Apps usually do not call this API
themselves: they declare `overrides` in the manifest, and **host**
`PluginEngine` (which *can* import `@/lib/override`) calls `addOverride`.

The bridge (`bridge.ts`) is the escape hatch if a federated bundle must
register without going through PluginEngine. It exposes:

```ts
window.__careOverrides.addComponent(key, { component, condition?, priority? })
```

This global is installed as a side effect when `src/lib/override/index.ts` is
first imported (before any plugin manifest evaluates). `addComponent` is
`addOverride`.

> **Manifest vs. registry shape.** Care Apps declare overrides in their manifest
> using the higher-level contract documented in `care-apps-plugin-overrides.md`
> (`{ component: "PatientCard", replacement, condition?, priority? }`, where
> `component` is the string key and `replacement` is the component). `PluginEngine`
> reads those entries and calls the registry-level `addOverride(key, { component,
> condition?, priority? })` / `window.__careOverrides.addComponent` shown here,
> where `component` is the replacement component itself.

---

## `__base` Prop Injection

When an override is chosen (`Component !== BaseComponent`), the wrapper
injects `__base` pointing to the original. Base renders do not get this prop.
Overrides can fall through to the original:

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
2. Renders a short message naming the component (for example: *A plugin
   override for UserDashboard encountered an error and was replaced with
   the default.*)

That message is the fallback. The original base component is **not**
re-rendered, despite the console log saying "falling back to base
component."

The rest of the app keeps working (sidebar, other routes). The crashed
component's slot stays as that message until you leave and come back, or
reload after the override is fixed.

This is not the same as `PluginEngine`'s full-screen `ErrorBoundary` ("Care
has encountered an unexpected error"), which wraps plugin loading, not a
single override slot.

---

## Performance Summary

| Operation                   | Cost                        |
| --------------------------- | --------------------------- |
| Resolution map computation  | O(registry size × overrides) — runs once per context change |
| Component render (fast)     | O(1) map lookup             |
| Stack node creation         | O(1) linked-list append     |
| Stack-aware resolution      | O(overrides × depth) — rare |

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
