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

Built on **shadcn/ui** + **Radix UI primitives** + **Tailwind CSS v4** (shadcn/ui pattern):

- `src/components/ui/` — Base UI primitives (Button, Dialog, Form, Select, etc.). Do not modify these directly.
- `src/CAREUI/` — Custom healthcare icon library, use `lucide-react` unless you are explicitly asked to use CAREUI icons.
- Forms use `react-hook-form` + `zod` validation with the custom `<Form>` component

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
