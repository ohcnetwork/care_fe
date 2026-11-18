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

Preserve layout compatibility when importing updates: responsive control defaults use local CSS variables so caller height and padding classes still win; cards leave spacing to their sections; wrapped badges and command rows grow with their content. Tabs read their own orientation rather than an ancestor group, so nested horizontal filters work inside vertical encounter navigation. Ghost buttons keep undecorated labels; the link variant retains link styling. When a page wants an underlined text action, add `underline underline-offset-4` to that button locally rather than changing the shared variant.

Button icons use a local size scale: 16px for `default`, legacy `md`, `sm`, `icon`, and `icon-sm`; 14px for `xs` and `icon-xs`; 20px for `lg`, `xl`, and `icon-lg`; and 24px for `icon-xl`. Default and standard icon buttons retain the icon's own stroke width rather than forcing 1.75. Explicit icon `size-*` classes still override the defaults. Preserve button heights and touch targets when adjusting icon sizing.

Alert dialogs put padding on `AlertDialogHeader` and `AlertDialogFooter`, not `AlertDialogContent`. Standalone body content (including errors and plugin content) needs `px-4 md:px-6` to align with those sections. Avoid adding shell padding, which doubles section padding and insets the full-width footer. Pass `variant` and `size` directly to `Button`, `AlertDialogAction`, and `AlertDialogCancel`; layering `buttonVariants()` through `className` can leave the default variant's text shadows, shadow colors, and inset highlights behind. Reserve `buttonVariants()` for elements that do not already render a styled button.

CareUI composites also supply Combobox, Filters, Pagination, Kbd, Spinner, and Empty. Existing application wrappers compose these components: Autocomplete and MultiSelect retain asynchronous searches and selection callbacks; MultiFilter adapts URL filters and clinical date/tag/location/user pickers; Pagination retains server page state; ShortcutBadge retains shortcut lookup and visibility. Common/Table re-exports the shared table primitives. Extend these adapters for application behavior instead of recreating control styling in feature pages.

Facility general settings compose CareUI cards, buttons, and badges with semantic theme tokens. Only the General page is constrained to `max-w-5xl`. Empty and uploaded covers share a compact banner height; uploaded images fill it with `object-cover` while the upload cropper remains 16:9. Facility details and forms sit side by side on desktop and stack on mobile; quick links remain available below forms. Cover and description editing require facility-update permission. Deletion remains restricted to superusers and sits in a collapsed accordion directly below facility details on desktop, and last on mobile.

The imported Filters component exposes custom-renderer open state so clinical pickers open after adding a filter, plus per-field clear permissions and layout classes. Its select fields use single selection and multiselect fields use multiple selection. Preserve these adaptations when refreshing registry source. Questionnaire ChoiceChipGroup similarly supplies one shared RadioGroup for keyboard navigation while retaining optional-answer clearing.

Questionnaire visibility evaluates root answers and controller ancestry. Circular dependencies (including a group depending on its own descendant) are configuration errors: the builder blocks saving them, and previously saved forms display an alert and disable the circular questions. Submission is blocked for the entire fill session if any form has circular conditions, preserving every form's draft rather than silently omitting affected answers. Cycle detection runs when the link index is built; per-evaluation memoization then keeps overlapping conditional dependencies bounded without reusing stale answers.

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
