# Playwright E2E Testing

E2E setup, commands, and workflows for the CARE frontend. See [`AGENTS.md`](../AGENTS.md) for the top-level agent guidance that links here, and [`tests/PLAYWRIGHT_GUIDE.md`](../tests/PLAYWRIGHT_GUIDE.md) for complete patterns covering form interactions, selectors, assertions, and helpers.

**Prerequisites:** Backend must be running on port 9000 (see [`local-development.md`](./local-development.md)), and a production build must exist (`npm run build`).

CI uses the `CARE_BACKEND_REF` default in [the Playwright workflow](../.github/workflows/playwright.yaml). It currently points to `ENG-737-backup`, the companion backend required by questionnaire actions; restore `develop` once that dependency lands. Manual **Playwright Tests** runs can override it with the `backend_ref` input and run regardless of changed-file filters.

```bash
npm run playwright:install                              # Install browsers (first time)
npm run build                                           # Build app (tests run against production build)
npm run playwright:test                                 # Run all tests
npm run playwright:test -- tests/auth/login.spec.ts     # Run a single test file
npm run playwright:test -- -g "test name"               # Run tests matching a pattern
npm run playwright:test -- --workers=4                   # Run with 4 parallel workers
npm run playwright:test -- --shard=1/8                   # Run one equal-count shard locally
npm run playwright:test:ui                              # Interactive Playwright UI mode
```

**Playwright E2E test credentials (local/test only; do not use on deployed instances)** (used in `tests/setup/*.setup.ts`):

| Storage State                    | Username         | Password   |
| -------------------------------- | ---------------- | ---------- |
| `tests/.auth/user.json`          | `admin`          | `admin`    |
| `tests/.auth/nurse.json`         | `care-nurse`     | `Ohcn@123` |
| `tests/.auth/facilityAdmin.json` | `care-fac-admin` | `Ohcn@123` |

## Running tests efficiently

- CI runs 8 shards on `ubuntu-latest-m`, with 6 Chromium workers per runner by default. Each shard pays its own backend and setup cost, so the workflow uses eight larger runners rather than splitting the suite across many smaller jobs.
- CI uses Playwright's built-in `--shard=N/8` with `fullyParallel: true` to distribute tests across 8 runners. Each shard uses 6 Chromium workers by default.
- The setup project runs independent login and fixture setup tasks in parallel while preserving facility → patient → account dependencies.
- Shard artifacts use Playwright's blob reporter; the report job merges them into one HTML report.
- Use `--shard=N/TOTAL` to split a local run across shards.
- Run specific test directories to iterate faster: `npx playwright test tests/auth/`
- The `setup-*` projects run before Chromium to authenticate test users and save storage state.
- The `vite-modules` project runs specs that import source modules (`/src/...`) into the page, such as `fillScribeActions.spec.ts`. Playwright starts a Vite dev server on port 4100 for it, because the preview build does not serve source modules. The dev server starts only when the run can include this project (no `--project`, or a `--project` that matches `vite-modules`), and a run of only `--project=vite-modules` skips the preview server. These specs answer their own API calls, so they need no backend or setup projects. CI runs them once, on shard 1, in their own step. Add a spec to `VITE_MODULE_SPECS` in `playwright.config.ts` to run it there

## Isolated component checks

The date-range picker suite builds its fixture in memory with the existing Vite dependencies and serves it through Playwright request interception. It exercises the real picker, popover and date multi-filter without backend data or saved authentication:

```bash
npx playwright test tests/components/dateRangePicker.spec.ts --project=chromium --no-deps --workers=1 --reporter=line
```

Keep a frontend server running at the configured base URL, or provide a production build so Playwright can start its preview server. The suite covers typed and clicked ranges, validation, bounds, keyboard focus, draft cancellation, month navigation, a 320px viewport and CSS 200% zoom. It also checks segment selection/stepping/replacement, leap-year clamping, T/Escape shortcuts, side-by-side field layout and the actual shared input/button dimensions at mobile and desktop widths. It does not replace authenticated list-page or mobile-device QA.

## Database management for re-runs

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

## Test structure

- `tests/setup/` — Authentication & fixture setup (runs before tests)
- `tests/auth/` — Login, session, homepage tests
- `tests/facility/` — Facility management, settings, patients, encounters
- `tests/admin/` — Admin panel tests
- `tests/organization/` — Organization management
- `tests/helper/` — Shared test utilities
- `tests/support/` — ID management (facility, patient, encounter IDs)

## Writing new tests

- Use `faker` for data generation — avoid hardcoded names/slugs that collide on re-run
- Use `Date.now()` or `faker.string.alphanumeric()` for unique identifiers
- Don't rely on cleanup — the DB snapshot system handles state reset
- Use `getFacilityId()`, `getPatientId()`, `getEncounterId()` from `tests/support/` for fixture IDs
