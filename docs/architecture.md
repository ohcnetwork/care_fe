# Architecture

Frontend architecture reference for the CARE frontend (React 19 + TypeScript + Vite). See [`AGENTS.md`](../AGENTS.md) for the top-level agent guidance that links here.

## Routing (TanStack Router)

- **TanStack Router** owns the history. The route tree is file-based under `src/routes/` (`@tanstack/router-plugin`). `autoCodeSplitting` is off: each route file imports its page component directly. The plugin generates `src/routeTree.gen.ts`; the file is committed and is regenerated on every dev/build run. `src/router.tsx` creates the router with a string-preserving search serializer (`src/lib/router/searchParams.ts`), `queryClient` in context, intent preloading and scroll restoration.
- **Areas.** The router context holds `{ queryClient, auth }` (`src/lib/router/auth.ts`). `auth.status` is `loading`, `user` (staff), `patient` (OTP) or `anonymous`. Pathless layouts guard each area in `beforeLoad`:
  - `_public` (sign-in, password reset, public facility pages): staff users go to `/`.
  - `_patient` (patient portal): signed-out users go to `/login?redirect=<url>`; staff users get a not-found.
  - `_app` (staff pages): signed-out users and patients go to `/login?redirect=<url>`.
- **Pages.** Every core page is a file route under `src/routes/_app/` (staff) or an area directory. Use flat file names that keep the param names of the URL (`facility.$facilityId.locations.$locationId.beds.tsx`). A file whose name is a prefix of other files becomes their layout; give it an `.index.tsx` child when its exact path is a page, or it renders an empty `<Outlet />` there. Create a layout only for a prefix whose pages share it. Pages that render the same component for several URLs (patient tabs, the encounters overview) use one route with an optional param (`{-$tab}`) or a layout whose children have no component, so the page does not remount when the user changes the tab. In a route component, read params with `useParams({ from: "<route id>" })`, not `Route.useParams()` (lint rule). This keeps the component independent of its route module: with `autoCodeSplitting` on, a component chunk that imports its route file makes every route definition load as a separate chunk at startup. Path params keep commas as is (`pathParamsAllowedCharacters`), because some params hold comma-separated ids.
- **Shared URLs.** Some URLs belong to more than one area: `/`, `/session-expired` and `/licenses` (staff and public), and `/patient/home`, `/patient/$id/{-$tab}`, `/referrals/$referralId` and `/referrals/$referralId/respond` (staff and patient). The router matches by path only, so each of these is one route at the root. Its `beforeLoad` resolves the area from `context.auth`, and its component uses `useArea()` to pick the page. Keep new URLs area-specific where possible.
- **Chrome.** `src/routes/__root.tsx` renders the chrome of the resolved area (`AreaChrome` in `src/Routers/AreaChrome.tsx`): the staff shell (`AppShell`), the patient shell (`PatientShell`) or the public chrome. The chrome stays mounted while the area is the same. The root shows the loading screen until the session is known.
- **Side effects during render.** The router renders a route change inside a React transition. A page that calls `toast` (or another update of a different component) during render interrupts that transition, and the render restarts without end. Call `toast` and `navigate` in effects or event handlers.
- **Layout flags.** Routes set `staticData` (`src/lib/router/staticData.ts`): `sidebar`, `workspace` and `navigation` for the staff shell, `patientChrome` for the patient shell, and `crumb` for breadcrumbs (`src/components/Common/Breadcrumbs.tsx`). The deepest matched route that sets a flag wins, and a flag on a layout covers its children. Read them with `useLayoutFlags()` (`src/lib/router/layoutFlags.ts`). Do not test the URL to choose a layout. Use `fullScreenPage` or `questionnaireFillPage` for pages without the sidebar.
- **Plugin routes.** Manifest `routes` and `organizationTabs` pages are attached to the live tree at runtime (`src/lib/router/pluginRoutes.tsx`). Until the manifests load, the `_app/$` splat shows a spinner for an unknown staff path; after that, not-found. A core route always wins over a plugin route with the same path. A plugin route takes its layout flags from the deepest core layout route above its path (for example, `/facility/$facilityId/settings/<page>` gets the settings workspace).
- **Back.** `goBack(fallback?)` (`src/Utils/utils.ts`) and `<BackButton>` go back when the previous history entry belongs to the app (`router.history.canGoBack()`). Otherwise they replace the URL with the fallback or the nearest parent route, so the user does not leave the app. `navigateBackFrom()` (`src/Utils/navigationTrail.ts`) goes back past a group of pages (for example, all of an encounter's tabs) with `history.go(-n)`. It keys the trail by the router's history index.
- **Unsaved changes.** Use `useNavigationBlocker(when, message)` (`src/hooks/useNavigationBlocker.ts`), a `useBlocker` wrapper. It also covers reload and closing the tab.
- Federation shares `@tanstack/react-router`, so a plugin uses the host router for navigation (`Link`, `useNavigate`, `useLocation`, `useBlocker`, `useCanGoBack`). The host no longer installs or shares raviger: a plugin that imports raviger uses its own bundled copy, which does not see the host's navigations and breaks back tracking, so migrate it to `@tanstack/react-router`. Plugin code does not know the core route tree. Use an absolute `to`, or add `unsafeRelative: "path"` to resolve a relative `to` from the URL path. Without it, a relative `to` resolves from the nearest route match, not from the URL.

**Links and navigation.**

- Target route known: `<Link to params search>` from `@tanstack/react-router`, and `navigate({ to, params, search, replace })` from `src/lib/router/navigate.ts`. Both are type-checked against the route tree. `navigate` works outside components, `window.location` is current when it returns, and it skips a second navigation to the URL that is already in flight (a page that navigates during render does not restart the load).
- URL built at runtime (from the API, a `redirect` query param, a nav config): `<HrefLink href>` (`src/lib/router/HrefLink.tsx`) and `navigate({ href })`. A relative `href` resolves against the current URL; a URL on another origin loads that page. `HrefLink` renders a plain anchor: no preload and no active state.
- A typed `Link` that is active (prefix match by default) sets `aria-current="page"`, `data-status="active"` and the class `active`. Where a component owns its active state (nav items, tabs), use `HrefLink` or set `activeOptions`.
- Query string: `useQueryParams(schema)` (`src/lib/router/queryParams.ts`) returns typed values and a setter `(query, { overwrite, replace })`; a `null` or `undefined` value removes a key. Without a schema it returns the raw strings: use that only to copy the whole query string. `useFilters({ schema })` and `useScopedQueryParams(schema)` build on it and need a schema. Prefer `useSearch` where the route is known. `useFilters({ cache: true })` saves the filters of a page per path and restores them when the page opens without a query string. The cache is off by default.
- Search params: a route that reads query values sets `validateSearch` to a zod schema from `src/lib/router/search/` (one file per area, such as `billing.ts`). Pages import the same schema, so do not define one in a route file; the lint rule keeps pages and components out of these files, because they load at startup. The serializer reads every value as a string, and when the page loads and on each navigation the router writes the parsed values back into the URL with `String()`. Build schemas from the helpers in `fields.ts`: each field is optional, has no default, and reads an invalid value as `undefined` (the router drops it from the URL when the page loads). A page that renders under several routes gets the same schema on each of them. When the tabs of one route use the same key with different values (`status` on the account page), the route schema lists the key with `searchString()` and each tab parses its own schema. Read typed values with `useSearch({ from })` in a route component, and with `useFilters({ schema })` or `useQueryParams(schema)` in a page. `Link` and `navigate` type `search` from the schema.
- Current URL for code outside a route (sidebar, providers): `usePathname()` and `useCurrentLocation()` (`src/lib/router/location.ts`), `useRouteParams(pattern)` (`src/hooks/useRouteParams.ts`), and `useLocationChange(fn)` for each history change. While the router loads a page for a different route, the previous page stays on screen (the root route makes it `inert`, so a click cannot land on it), and these hooks return its location. `isShowingPreviousPage` in `src/lib/router/previousPage.ts` holds the rule.
- Do not call `window.history.pushState` directly: it breaks the router's back-stack index.

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

Use the shared `FilterSelect` for single-value toolbar filters. It composes CareUI's radio dropdown, displays the selected value beside the label, and clears through `onClear` when "All" is selected. Browser tests should target its button and `menuitemradio` options rather than a combobox or a separate clear button.

Use `DropdownMenuTrigger` directly for a native Base UI trigger with its own styling. Plain triggers are unstyled by default; opt into `appearance="field"` for field-like controls or `appearance="icon"` for flat overflow menus. Give icon-only triggers an accessible name. Use `render` or `asChild` only when supplying a custom trigger that owns its styling, such as a CareUI Button. The menu popup styles are independent of the trigger.

Select, standalone Combobox, and DropdownMenu field triggers share the same field surface without sharing behavior. Autocomplete and MultiSelect use that surface on both their desktop and mobile triggers. Inside a Combobox input, the input group owns the shadow and the chevron uses the flat `addon` appearance.

Standalone text inputs and textareas default to `bg-background`. For composite inputs such as password and phone fields, the input group owns the background; keep the inner control transparent. Explicit field colors and CareUI's dark-mode tint take precedence.

Use `PopoverTrigger appearance="field"` for field-like controls such as DatePicker. Plain Popover triggers remain unstyled, and custom `render` or `asChild` triggers keep their own styling.

`TabsList variant="line"` owns its divider: a bottom border for horizontal tabs and a right border for vertical tabs. Horizontal line lists are 1px taller than the shared tab height so each trigger keeps the default button height above the divider. The list fills the available width and grows with non-wrapping tabs inside horizontal scroll containers. Its active indicator stays within the list, so callers should not add divider borders or extra bottom padding to either the list or its wrapper. Keep wrappers for layout and scrolling only; put horizontal inset padding on the list so the divider still reaches both edges, and set `w-full` explicitly for wrapping or grid layouts. `FilterTabs variant="underline"` fills the remaining width of its row. The `default` and `browser` variants retain their own styling. Tab focus rings draw inside each trigger, so scroll containers do not clip them. Default tabs stay on one line; when translated labels do not fit on narrow screens, switch the page to a `Select` below a breakpoint or let its triggers wrap (`h-auto whitespace-normal`).

The shared components and theme are based on [CareUI commit 4e143863](https://github.com/ohcnetwork/careui/tree/4e143863698da01881d522361ff68b626d4e7db1). CareUI is consumed as registry source. `@base-ui/react` is its required primitive dependency. Keep the `shadcn/tailwind.css` import: it provides CareUI's state and orientation variants, including `data-horizontal` and `data-vertical`.

The setup also imports CareUI's variable Figtree and Geist Mono fonts and typeset styles. Semantic colors and the primary scale come from the upstream theme. Existing numbered `secondary-*` classes are compatibility aliases for CareUI's neutral palette, rather than a separate brand palette. Keep Tailwind configuration from overriding these font and color tokens.

Stage registry additions in a temporary directory with `npx shadcn add @careui/<component> --path /tmp/careui-import`, then review and move UI files into `src/components/ui/` and hook files into `src/hooks/`. Check their imports and preserve the adaptations below. The registry's default file targets point to `components/careui/`; a plain `add` would recreate that separate directory. The `--path` override applies to hooks as well as components, so it should not be used to overwrite the shared UI directory blindly.

CARE retains typed compatibility for existing call sites: button/status variant names, `asChild`, single-value accordions, tri-state checkboxes, string selections, mounted tab panels, cancelable popup events, and form field association. Calendar year paging, phone number constraints, and clinical composites remain application-specific. When updating registry files, preserve these contracts and run type checking plus relevant browser workflows. Popup positioning uses Base UI variables such as `--anchor-width`; state styles use `data-active`, `data-checked`, and `data-open` (triggers use `data-popup-open`). Autocomplete popups anchor to the whole control (trigger and clear button), align to its start edge, and are at least the standard popover width (`w-72`), so narrow triggers don't wrap options.

Calendar uses React DayPicker for date selection. Its month/year dropdowns overlay accessible native selects on a single visual caption. Memoize its component renderers: changing component types on selection or hover remounts day buttons and loses clicks and keyboard focus. Range-middle dates use muted backgrounds and foreground text; only range endpoints and single selections use primary colors. Keep these states in Calendar rather than overriding range colors in consumers. When a consumer owns the selection, pass `onSelect`: without it DayPicker treats `selected` as an initial value and keeps its own selection, so the highlight drifts from your state.

Use `DateRangePicker` for local-date ranges that are applied as a whole. Apply commits any valid draft, including an open-ended one. Closing the picker for any reason except Escape (outside press, the trigger, focus leaving) also applies the draft when it is a complete, valid range that differs from the value; a lone date may be mid-selection, so it keeps the previous value. Escape and the panel's Back button always discard the draft. The default `popover` variant owns a trigger and does this itself; `variant="panel"` embeds the same editor in an existing surface, and its host reads `dismissRange` through `ref` when it closes. The date multi-filter's menus do this through `applyDateDraftOnClose`. `minDate` and `maxDate` on `DateFilterMeta` constrain both typing and calendar navigation. Masked text fields and the range calendar share draft state; the highlighted field determines which edge a day click edits, and clicking a day before Start while End is empty swaps them, as typing a reversed range does.

Use the arrows to move one month at a time, or open the month/year heading to browse years in pages of 12. Choose a year, then a month, to return to the day grid without changing the draft. No inner scroll region is introduced, and the Apply footer stays sticky if the containing popup must scroll on a short screen. Set `allowOpenEnded={false}` when both endpoints are required. In forms, wrap the popover variant in `FormControl` and pass the label's id as `aria-labelledby`; its field-style trigger then announces the label and the current range. Scheduling forms edit `valid_from` and `valid_to` together through `ScheduleValidityField`. Dates are normalized to local start-of-day values; never parse date-only ISO strings through `new Date(string)`.

The range fields compose `SegmentedDateInput` with CARE's `InputGroup`, input and clear button rather than copying their sizing, borders or shadows. They sit side by side on desktop when the panel has room and stack on mobile or in narrow containers so full-size date text fits; the shared range calendar is the only calendar picker. Left/Right selects DD, MM or YYYY; Up/Down steps that segment (month/year changes clamp to valid month ends), and typing replaces a selected segment. T commits today immediately; Escape clears only the focused field and is consumed before the containing popup can dismiss. Escape elsewhere still dismisses the relevant popup. Range header, month selectors and navigation buttons use standard default/icon sizes; the month/year caption uses `ghost` and a short month name so it fits beside Today, and only the month part may ellipsize, never the year.

Preserve layout compatibility when importing updates: responsive control defaults use local CSS variables so caller height and padding classes still win; cards leave spacing to their sections; wrapped badges and command rows grow with their content. Tabs read their own orientation rather than an ancestor group, so nested horizontal filters work inside vertical encounter navigation. Ghost buttons keep undecorated labels; the link variant retains link styling. When a page wants an underlined text action, add `underline underline-offset-4` to that button locally rather than changing the shared variant.

Button icons use a local size scale: 16px for `default`, legacy `md`, `sm`, `icon`, and `icon-sm`; 14px for `xs` and `icon-xs`; 20px for `lg`, `xl`, and `icon-lg`; and 24px for `icon-xl`. Default and standard icon buttons retain the icon's own stroke width rather than forcing 1.75. Explicit icon `size-*` classes still override the defaults. Preserve button heights and touch targets when adjusting icon sizing.

Compact radio cards (`RadioGroup` → `FieldLabel` → horizontal `Field`) match the default button's minimum height and horizontal padding. The card can grow for wrapped text; the radio indicator keeps its own size. Cards with a `FieldDescription` keep their content-driven spacing. A checked card uses the radio's `primary` token: `border-primary` with a `bg-primary/5` tint (`bg-primary/10` in dark mode), so the card and its indicator share one selection colour.

Below `sm`, Add New User uses field legends and dividers instead of section headings. Its repeatable lists share a card layout: adding a card focuses its first control; removing one focuses the next card, the previous card if it was last, or the Add button when the list is empty. Edit User, service accounts and desktop retain the existing layout.

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

JWT tokens in localStorage. `AuthUserProvider` (outside the router, in `src/App.tsx`) handles login/logout, token refresh (every 5 minutes), 2FA, and cross-tab session sync. It registers the session status that the route guards read, and calls `router.invalidate()` when the status changes. Patients sign in with an OTP; their pages are in the `_patient` area.

## Key Directories

- `src/components/` — Feature-organized components (Auth, Facility, Patient, Encounter, Medicine, etc.)
- `src/pages/` — Page components by feature (Admin, Appointments, Facility, Organization, Patient)
- `src/types/` — Domain type definitions with corresponding `*Api.ts` route files
- `src/Utils/request/` — API request infrastructure (query, mutate, error handling)
- `src/hooks/` — Custom React hooks (auth, file management, plugins, etc.)
- `src/Providers/` — Auth, history, patient user providers
- `src/Routers/` — App routing and route definitions

## Configuration

`care.config.ts` centralizes runtime config (API URLs, feature flags, locale settings, plugin config). Environment variables prefixed with `REACT_`. A deployment can override them without a rebuild through `/runtime-env.js`; see [Runtime configuration](runtime-configuration.md).
