# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is CARE?

CARE is a Digital Public Good building an open source EMR + Hospital Management system. This is the React frontend (React 19 + TypeScript + Vite).

## Local Development Environment

### Backend Setup (care)

Clone the [care backend](https://github.com/ohcnetwork/care) alongside this repo and create a Python 3.13 venv with dependencies installed.

**Start backend services:**

```bash
# Ensure PostgreSQL and Redis are running
pg_isready || sudo pg_ctlcluster 16 main start
redis-cli ping || redis-server --daemonize yes

# Start Django backend on port 9000 (from the care backend directory)
cd <care-backend-dir>
DJANGO_SETTINGS_MODULE=config.settings.local DJANGO_READ_DOT_ENV_FILE=true .venv/bin/python manage.py runserver 0.0.0.0:9000
```

**Database commands:**

```bash
cd <care-backend-dir>
.venv/bin/python manage.py migrate                    # Run migrations
.venv/bin/python manage.py load_fixtures              # Load test data
```

**Backend fixture credentials:**

| Role           | Username         | Password   |
| -------------- | ---------------- | ---------- |
| Doctor         | `care-doctor`    | `Ohcn@123` |
| Admin          | `care-admin`     | `Ohcn@123` |
| Nurse          | `care-nurse`     | `Ohcn@123` |
| Staff          | `care-staff`     | `Ohcn@123` |
| Volunteer      | `care-volunteer` | `Ohcn@123` |
| Facility Admin | `care-fac-admin` | `Ohcn@123` |

**Managing organization users** (Health Department):

| Role    | Username            | Password   |
| ------- | ------------------- | ---------- |
| Admin   | `care-role-admin`   | `Ohcn@123` |
| Manager | `care-role-manager` | `Ohcn@123` |
| Member  | `care-role-member`  | `Ohcn@123` |

**Playwright E2E test credentials** (used in `tests/setup/*.setup.ts`):

| Storage State                    | Username         | Password   |
| -------------------------------- | ---------------- | ---------- |
| `tests/.auth/user.json`          | `admin`          | `admin`    |
| `tests/.auth/nurse.json`         | `care-nurse`     | `Ohcn@123` |
| `tests/.auth/facilityAdmin.json` | `care-fac-admin` | `Ohcn@123` |

### Frontend Setup

The frontend is configured via `.env.local` to use the local backend:

```
REACT_CARE_API_URL=http://127.0.0.1:9000
```

## Build/Lint/Test Commands

- `npm run dev` — Start dev server at http://localhost:4000
- `npm run build` — Production build (takes 2+ minutes, set timeout to 180s+)
- `npm run lint` — Run ESLint (takes 85s+, set timeout to 120s+)
- `npm run lint-fix` — ESLint with auto-fix
- `npm run format` — Prettier formatting

### Playwright E2E Tests

**Prerequisites:** Backend must be running on port 9000, and a production build must exist (`npm run build`).

```bash
npm run playwright:install                              # Install browsers (first time)
npm run build                                           # Build app (tests run against production build)
npm run playwright:test                                 # Run all tests
npm run playwright:test -- tests/auth/login.spec.ts     # Run a single test file
npm run playwright:test -- -g "test name"               # Run tests matching a pattern
npm run playwright:test -- --workers=4                   # Run with 4 parallel workers
npm run playwright:test -- --shard=1/3                   # Run shard 1 of 3
npm run playwright:test:ui                              # Interactive Playwright UI mode
```

**Running tests efficiently:**

- Use `--workers=4` for parallel execution (CI runs setup with 1 worker, then chromium with 4 workers)
- Use `--shard=N/TOTAL` to split across multiple processes
- Run specific test directories to iterate faster: `npx playwright test tests/auth/`
- The `setup` project runs first to authenticate test users and save storage state

**Database management for re-runs:**

Tests create data (patients, roles, locations, etc.) that can cause conflicts on re-run. Use the DB snapshot system:

```bash
# Set CARE_BACKEND_DIR to your care backend checkout (required for db-reset)
export CARE_BACKEND_DIR=/path/to/care

npm run playwright:db-reset      # First time: migrate + fixtures + snapshot (~30s)
npm run playwright:db-restore    # Before re-runs: restore clean state (~2s)
npm run playwright:db-snapshot   # Save current state as new baseline
npm run playwright:db-status     # Check snapshot info
```

The `globalSetup` automatically restores the DB snapshot before each local test run (skipped on CI). To set up for the first time:

```bash
npm run playwright:db-reset      # Creates snapshot with fixtures
npm run playwright:test           # Tests run against clean DB, auto-restores on next run
```

**Test structure:**

- `tests/setup/` — Authentication & fixture setup (runs before tests)
- `tests/auth/` — Login, session, homepage tests
- `tests/facility/` — Facility management, settings, patients, encounters
- `tests/admin/` — Admin panel tests
- `tests/organization/` — Organization management
- `tests/helper/` — Shared test utilities
- `tests/support/` — ID management (facility, patient, encounter IDs)

**Writing new tests:**

- Use `faker` for data generation — avoid hardcoded names/slugs that collide on re-run
- Use `Date.now()` or `faker.string.alphanumeric()` for unique identifiers
- Don't rely on cleanup — the DB snapshot system handles state reset
- Use `getFacilityId()`, `getPatientId()`, `getEncounterId()` from `tests/support/` for fixture IDs

## Code Style Guidelines

- **TypeScript**: Strict mode, ES2022 target, path aliases (`@/*` → `src/*`, `@careConfig` → `care.config.ts`)
- **Formatting**: Double quotes, 2-space indent, semicolons required
- **Imports**: Order by 3rd-party → library → CAREUI → UI → components → hooks → utils → relative. Prettier plugin auto-sorts on format.
- **Types**: Use `interface` for objects, avoid `any`, prefer maps over enums
- **Naming**: PascalCase for component files (`AuthWizard.tsx`), camelCase for hooks/utils (`useAuth.ts`), kebab-case for directories
- **Components**: Functional components only, named exports preferred, one component per file
- **i18n**: All user-facing strings must use i18next. English translations go in `public/locale/en.json`. Non-English managed via Crowdin — do not edit directly.

## Architecture

### Routing (Raviger)

Routes defined in `src/Routers/routes/` (e.g., `FacilityRoutes.tsx`, `PatientRoutes.tsx`). Combined in `src/Routers/AppRouter.tsx`. Three routers: `PublicRouter`, `PatientRouter`, `AppRouter` — selected by auth state. Plugin routes injected via `usePluginRoutes()`.

```typescript
const FacilityRoutes: AppRoutes = {
  "/facility/:facilityId/overview": ({ facilityId }) => <FacilityOverview facilityId={facilityId} />,
};
```

Use `navigate()` from raviger for programmatic navigation.

### API Layer (TanStack Query + custom wrappers)

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

### State Management

- **TanStack Query** — Server state (API data caching, refetching)
- **Jotai atoms** (`src/atoms/`) — Lightweight client state (user, nav, filters)
- **React Context** (`src/context/`) — Permissions (`PermissionContext`), keyboard shortcuts

### UI Components

Built on **shadcn/ui** + **Radix UI primitives** + **Tailwind CSS v4** (shadcn/ui pattern):

- `src/components/ui/` — Base UI primitives (Button, Dialog, Form, Select, etc.). Do not modify these directly.
- `src/CAREUI/` — Custom healthcare icon library, use `lucide-react` unless you are explicitly asked to use CAREUI icons.
- Forms use `react-hook-form` + `zod` validation with the custom `<Form>` component

### Plugin System (Module Federation)

Micro-frontend architecture via `@originjs/vite-plugin-federation`. Plugins configured via `REACT_ENABLED_APPS` env var. Plugin manifests define routes, components, tabs, and devices they provide. Key files: `src/PluginEngine.tsx`, `src/pluginTypes.ts`.

### Auth Flow

JWT tokens in localStorage. `AuthUserProvider` handles login/logout, token refresh (every 5 minutes), 2FA, and cross-tab session sync. Patient login uses separate OTP-based flow via `PatientRouter`.

### Key Directories

- `src/components/` — Feature-organized components (Auth, Facility, Patient, Encounter, Medicine, etc.)
- `src/pages/` — Page components by feature (Admin, Appointments, Facility, Organization, Patient)
- `src/types/` — Domain type definitions with corresponding `*Api.ts` route files
- `src/Utils/request/` — API request infrastructure (query, mutate, error handling)
- `src/hooks/` — Custom React hooks (auth, file management, plugins, etc.)
- `src/Providers/` — Auth, history, patient user providers
- `src/Routers/` — App routing and route definitions

### Configuration

`care.config.ts` centralizes runtime config (API URLs, feature flags, locale settings, plugin config). Environment variables prefixed with `REACT_`.

## Git Workflow

- Branch naming: `issues/{issue#}/{short-name}`
- Default branch: `develop` (staging auto-deploys)
- Pre-commit hooks via husky run Prettier and ESLint on staged files

## Autonomous AI Workflow

When working autonomously on this codebase, follow this sequence:

1. **Before coding:** Read relevant source files and understand existing patterns
2. **After changes:** Run `npm run lint-fix` and `npm run format` on changed files (pre-commit hooks also run these automatically)
3. **Verify:** Run relevant Playwright tests against the local backend to validate changes
4. **For API changes:** Check corresponding backend endpoint in the care backend repo and update both repos if needed
5. **For new features:** Add Playwright tests in `tests/` following `tests/PLAYWRIGHT_GUIDE.md`
6. **For i18n:** Add English strings to `public/locale/en.json`
7. **For writing tests:** Read `tests/PLAYWRIGHT_GUIDE.md` — it contains complete patterns for all form interactions, selectors, assertions, and helpers

### Quick verification cycle

```bash
# 1. Lint & format (or rely on pre-commit hooks)
npm run lint-fix && npm run format

# 2. Type check
npx tsc --noEmit

# 3. Run related tests (requires backend + build)
npx playwright test tests/path/to/related/
```
