# Playwright E2E Testing

E2E setup, commands, and workflows for the CARE frontend. See [`AGENTS.md`](../AGENTS.md) for the top-level agent guidance that links here, and [`tests/PLAYWRIGHT_GUIDE.md`](../tests/PLAYWRIGHT_GUIDE.md) for complete patterns covering form interactions, selectors, assertions, and helpers.

**Prerequisites:** Backend must be running on port 9000 (see [`local-development.md`](./local-development.md)), and a production build must exist (`npm run build`).

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

**Playwright E2E test credentials (local/test only; do not use on deployed instances)** (used in `tests/setup/*.setup.ts`):

| Storage State                    | Username         | Password   |
| -------------------------------- | ---------------- | ---------- |
| `tests/.auth/user.json`          | `admin`          | `admin`    |
| `tests/.auth/nurse.json`         | `care-nurse`     | `Ohcn@123` |
| `tests/.auth/facilityAdmin.json` | `care-fac-admin` | `Ohcn@123` |

## Running tests efficiently

- Use `--workers=4` for parallel execution (CI runs setup with 1 worker, then chromium with 4 workers)
- Use `--shard=N/TOTAL` to split across multiple processes
- Run specific test directories to iterate faster: `npx playwright test tests/auth/`
- The `setup` project runs first to authenticate test users and save storage state

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
