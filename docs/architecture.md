# Architecture

Frontend architecture reference for the CARE frontend (React 19 + TypeScript + Vite). See [`AGENTS.md`](../AGENTS.md) for the top-level agent guidance that links here.

## Routing (Raviger)

Routes defined in `src/Routers/routes/` (e.g., `FacilityRoutes.tsx`, `PatientRoutes.tsx`). Combined in `src/Routers/AppRouter.tsx`. Three routers: `PublicRouter`, `PatientRouter`, `AppRouter` — selected by auth state. Plugin routes injected via `usePluginRoutes()`.

```typescript
const FacilityRoutes: AppRoutes = {
  "/facility/:facilityId/overview": ({ facilityId }) => <FacilityOverview facilityId={facilityId} />,
};
```

Use `navigate()` from raviger for programmatic navigation.

## API Layer (TanStack Query + custom wrappers)

API routes defined in `src/types/{domain}/{domain}Api.ts` using typed route objects:

```typescript
export default {
  list: {
    path: "/api/v1/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserReadMinimal>>(),
  },
} as const;
```

Queries use `query()` wrapper from `src/Utils/request/query.ts`:

```typescript
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: query(userApi.list),
});
// With path/query params:
queryFn: query(userApi.get, {
  pathParams: { username },
  queryParams: { search },
});
```

Mutations use `mutate()` wrapper from `src/Utils/request/mutate.ts`:

```typescript
const { mutate } = useMutation({
  mutationFn: mutate(userApi.create),
});
```

Also available: `query.debounced()` and `query.paginated()` for specialized use cases.

Errors handled globally — session expiry redirects to `/session-expired`, 400/406 show toast notifications. Use `silent: true` to suppress.

## State Management

- **TanStack Query** — Server state (API data caching, refetching)
- **Jotai atoms** (`src/atoms/`) — Lightweight client state (user, nav, filters)
- **React Context** (`src/context/`) — Permissions (`PermissionContext`), keyboard shortcuts

## UI Components

Built on **CareUI** + **Base UI primitives** + **Tailwind CSS v4**, distributed as shadcn registry source:

- `src/components/ui/` — The shared CareUI implementation (Button, Dialog, Form, Select, etc.) and CARE-specific compositions. All features, including referrals, import from this directory.
- `src/style/careui.css` — Global CareUI semantic tokens, light/dark themes, accessibility themes, and utilities. Use semantic colors such as `bg-background`, `text-foreground`, and `border-border`; no scoped `.careui` theme or `cui-*` aliases are needed.
- `components.json` — The `@careui` registry points to `https://careui.ohc.network/registry/care-ui/{name}/{name}.json`. Use the locally pinned shadcn CLI when importing registry source.

The shared components and theme are based on [CareUI commit 4e143863](https://github.com/ohcnetwork/careui/tree/4e143863698da01881d522361ff68b626d4e7db1). CareUI is consumed as registry source. `@base-ui/react` is its required primitive dependency. Keep the `shadcn/tailwind.css` import: it provides CareUI's state and orientation variants, including `data-horizontal` and `data-vertical`.

The setup also imports CareUI's variable Figtree and Geist Mono fonts and typeset styles. Semantic colors and the primary scale come from the upstream theme. Existing numbered `secondary-*` classes are compatibility aliases for CareUI's neutral palette, rather than a separate brand palette. Keep Tailwind configuration from overriding these font and color tokens.

Stage registry additions in a temporary directory with `npx shadcn add @careui/<component> --path /tmp/careui-import`, then review and move UI files into `src/components/ui/` and hook files into `src/hooks/`. Check their imports and preserve the adaptations below. The registry's default file targets point to `components/careui/`; a plain `add` would recreate that separate directory. The `--path` override applies to hooks as well as components, so it should not be used to overwrite the shared UI directory blindly.

CARE retains typed compatibility for existing call sites: button/status variant names, `asChild`, single-value accordions, tri-state checkboxes, string selections, mounted tab panels, cancelable popup events, and form field association. Calendar year paging, phone number constraints, and clinical composites remain application-specific. When updating registry files, preserve these contracts and run type checking plus relevant browser workflows. Popup positioning uses Base UI variables such as `--anchor-width`; state styles use `data-active`, `data-checked`, and `data-open` (triggers use `data-popup-open`).

Preserve layout compatibility when importing updates: responsive control defaults use local CSS variables so caller height and padding classes still win; cards leave spacing to their sections; wrapped badges and command rows grow with their content. Tabs read their own orientation rather than an ancestor group, so nested horizontal filters work inside vertical encounter navigation. Ghost buttons keep undecorated labels; the link variant retains link styling.

- `src/CAREUI/` — Custom healthcare icon library, use `lucide-react` unless you are explicitly asked to use CAREUI icons.
- Forms use `react-hook-form` + `zod` validation with the custom `<Form>` component

### Page content in the workspace header

Pages can render controls in the shared header using `WorkspaceHeaderContent`:

```tsx
import { WorkspaceHeaderContent } from "@/components/Common/WorkspaceHeaderContent";

<WorkspaceHeaderContent>
  <PageActions />
</WorkspaceHeaderContent>;
```

The content replaces the default header label or breadcrumbs while mounted and
is removed automatically when the page unmounts. It is rendered through a portal,
so controls retain the page's React context, permissions, and state. Both the
workspace header and inner workspace headers support this slot. Mount only the
controls needed for the current page; they can update normally as page data changes.

## Plugin System (Module Federation)

Micro-frontend architecture via `@originjs/vite-plugin-federation`. Plugins configured via `REACT_ENABLED_APPS` env var. Plugin manifests define routes, components, tabs, and devices they provide. Key files: `src/PluginEngine.tsx`, `src/pluginTypes.ts`.

Detailed plugin references:

- [`care-apps-architecture-note.md`](./care-apps-architecture-note.md) — How `PluginEngine` resolves and merges build-time and API plugins.
- [`care-apps-local-dev.md`](./care-apps-local-dev.md) — Plugin discovery, Vite federation, and local dev workflow.
- [`care-apps-override-architecture.md`](./care-apps-override-architecture.md) — The component override framework.

## Auth Flow

JWT tokens in localStorage. `AuthUserProvider` handles login/logout, token refresh (every 5 minutes), 2FA, and cross-tab session sync. Patient login uses separate OTP-based flow via `PatientRouter`.

## Key Directories

- `src/components/` — Feature-organized components (Auth, Facility, Patient, Encounter, Medicine, etc.)
- `src/pages/` — Page components by feature (Admin, Appointments, Facility, Organization, Patient)
- `src/types/` — Domain type definitions with corresponding `*Api.ts` route files
- `src/Utils/request/` — API request infrastructure (query, mutate, error handling)
- `src/hooks/` — Custom React hooks (auth, file management, plugins, etc.)
- `src/Providers/` — Auth, history, patient user providers
- `src/Routers/` — App routing and route definitions

## Configuration

`care.config.ts` centralizes runtime config (API URLs, feature flags, locale settings, plugin config). Environment variables prefixed with `REACT_`.
