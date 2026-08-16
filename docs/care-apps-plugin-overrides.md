# Care Apps Plugin Overrides

This document describes the final approach for making core CARE frontend
components overrideable by Care Apps.

## Goals

- Let Care Apps replace selected core React components.
- Keep core component call sites unchanged.
- Preserve context-aware overrides, including route and stack-path conditions.
- Avoid registering every exported component when deployments only need a small
  override surface.
- Keep transformed-code debugging usable with source maps.

## Build-Time Registration

Core components are registered by the Vite plugin in
`plugins/autoRegisterComponents.ts`.

The plugin scans `src/**/*.tsx`, excluding `src/lib/override`, and transforms
exported PascalCase React components into registered components.

Example source:

```tsx
export function BookAppointmentDetails(props: Props) {
  return <section />;
}
```

Generated shape (idea — the plugin keeps the original binding name and
appends a `…Registered` export; it does not rename the function to `…Base`):

```tsx
import { register as __careRegisterComponent } from "@/lib/override";

function BookAppointmentDetails(props: Props) {
  return <section />;
}

const BookAppointmentDetailsRegistered = __careRegisterComponent(
  "BookAppointmentDetails",
  BookAppointmentDetails,
);

export { BookAppointmentDetailsRegistered as BookAppointmentDetails };
```

The plugin uses `MagicString` to produce high-resolution source maps for these
edits. This improves browser stack traces and debugger locations for transformed
code. It does not remove the registered wrapper from the React component tree.

### Supported Export Forms

The plugin can only auto-register components exported in these three forms:

- `export function Foo(…) { … }` — named function declaration
- `export const Foo = …` — single-declarator variable with a component initializer (arrow function or function expression)
- `export default Foo` — default export assignment of a locally declared component

The following forms are **not** transformable and are silently skipped during registration:

- `export { Foo }` — named export specifier blocks
- `export { X as Y }` — aliased named export specifiers
- `export const A = …, B = …` — multi-declarator variable statements
- `export { Foo } from "./other"` — re-exports from another module
- `export const Foo = forwardRef(…)` / `export const Foo = memo(…)` — `forwardRef`/`memo` initializers (deliberately skipped because the registration wrapper does not forward refs)

Allowlisting a name (via `REACT_MFE_REGISTERED_COMPONENTS`) that uses one of the first four skipped forms is a build error that names the unsupported form. A `forwardRef`/`memo` component is reported instead as an unknown component name (it is excluded from registration by design); convert it to a plain `export function`/`export const` component if it must be overridable.

### Named + default in the same file

If a module has both a named component export (`export function Foo` or
`export const Foo`) **and** `export default Foo`, the plugin wraps the **named**
export first, then **skips** `export default Foo` (the name is already
transformed).

```
named hole    { Foo }     →  wrapped (sleeve)
default hole  import Foo  →  still the original
```

Call sites must import the hole that was wrapped. A **default** import of such a
file will not be overrideable via the allowlist. Fixes:

- One export only, matching the import (`export function Foo` + `{ Foo }`, or
  default-only + `import Foo from`).
- Or call `register()` by hand on the export the call site uses (for example
  `export default register("Foo", Foo)` when the router does
  `import Foo from`).

Hand-written `register()` does not need the allowlist. Renaming the inner
function to `FooBase` is optional (avoids two public values named `Foo`).

## Registration Allowlist

Use `REACT_MFE_REGISTERED_COMPONENTS` to limit which exported components are
auto-registered.

```env
REACT_MFE_REGISTERED_COMPONENTS=BookAppointmentDetails,Login,AuthHero
```

Behavior:

- Empty or unset registers **no** components (no wrapper overhead, no overrides possible).
- `*` registers every exported component.
- A comma-separated list registers only those exact component names.
- Unknown names fail the Vite build/dev server startup.
- Duplicate exported component names are still rejected so registration keys stay
  unambiguous.

This is a build-time setting. Changing it requires restarting the Vite dev server
or rebuilding the production bundle.

## Runtime Override Flow

Care Apps declare overrides in their manifest:

```ts
overrides: [
  {
    component: "BookAppointmentDetails",
    replacement: PluginBookAppointmentDetails,
    condition: {
      page: "appointments",
    },
    priority: 10,
  },
];
```

`PluginEngine` loads enabled app manifests, reads their `overrides`, and
calls `addOverride`. That only matters if the **call site imports the sleeve**
(`register()` wrapper) — a notebook entry with no sleeve on the page is a
no-op. At render time the sleeve chooses the base component or the
highest-priority matching override.

This keeps dynamic plugin loading safe: overrides can arrive after the app has
started, and mounted registered components can re-render against the updated
override registry.

## Stack-Aware Overrides

Overrides may use `condition.stackPath` when the same component should be
overridden only under a specific parent path.

```ts
condition: {
  stackPath: ["AppointmentPage", "BookAppointmentDetails"],
}
```

Every component name used in a stack path must be registered. If
`REACT_MFE_REGISTERED_COMPONENTS` is set, include both the overridden component
and the stack-path ancestors required for matching.

## Performance Model

Only registered rendered component instances pay the wrapper cost.

Measured synthetic production-mode overhead for an inactive registered wrapper is
roughly sub-microsecond per rendered instance. This is negligible for ordinary
page components, but can compound in dense lists or tables.

The allowlist is the main performance control:

- Registering all exported components maximizes override reach.
- Registering only listed components avoids wrapper overhead for every unlisted
  export.

The wrapper does not add a DOM node. It adds one React component boundary for
registered rendered components.

## Debugging

The Vite plugin emits high-resolution source maps with original source content.
This improves transformed-code error locations around generated imports and
appended `…Registered` exports. The transform does **not** rename the original
function to `…Base` (that name appears only in some hand-written `register()`
call sites).

React DevTools still shows the runtime wrapper shape:

```txt
Registered(BookAppointmentDetails)
  BookAppointmentDetails
```

That is expected. Source maps improve file and line mapping, not the runtime
component hierarchy.

## Why Vite Plugin Instead of Babel

The override system needs both a per-file transform and whole-app validation:

- duplicate registration-name detection
- unknown allowlist-name detection
- `src/lib/override` exclusion
- dev and production Vite lifecycle coverage

Those concerns fit Vite better than a Babel-only plugin. Babel would mainly help
with AST code generation; `MagicString` covers the current source-map need while
keeping the architecture in Vite.
