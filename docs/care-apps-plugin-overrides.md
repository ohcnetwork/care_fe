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

Generated shape:

```tsx
function BookAppointmentDetailsBase(props: Props) {
  return <section />;
}

export const BookAppointmentDetails = register(
  "BookAppointmentDetails",
  BookAppointmentDetailsBase,
);
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

## Registration Allowlist

Use `REACT_MFE_REGISTERED_COMPONENTS` to limit which exported components are
auto-registered.

```env
REACT_MFE_REGISTERED_COMPONENTS=BookAppointmentDetails,Login,AuthHero
```

Behavior:

- Empty, unset, or `*` registers every exported component.
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
registers them with the override registry. The core registered component remains
the stable React component type. At render time it chooses either the base
component or the highest-priority matching override.

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
This improves transformed-code error locations, especially around generated
imports, renamed base components, and appended registration exports.

React DevTools still shows the runtime wrapper shape:

```txt
Registered(BookAppointmentDetails)
  BookAppointmentDetailsBase
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
