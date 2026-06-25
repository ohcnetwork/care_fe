---
name: playwright
description: "Write, debug, and run Playwright E2E tests for CARE. Use when: creating new test files, fixing failing tests, adding test coverage, writing assertions, using test helpers, setting up test authentication, or running Playwright commands."
argument-hint: "Describe the test scenario or feature to test"
---

# Playwright E2E Testing for CARE

## When to Use

- Writing new Playwright test files
- Debugging failing E2E tests
- Adding test coverage for features
- Understanding test helpers and selectors
- Running or configuring Playwright tests

## When NOT to E2E Test

- **Pure logic/utilities** — validation functions, formatters, calculators → unit test
- **Component rendering** — conditional display, props variations → component test
- **API contract** — request/response shape → integration test or contract test
- **E2E is for user journeys** — login → navigate → fill form → submit → verify result
- **Rule of thumb:** if it doesn't need a browser and a running backend, it's not E2E

## Setup & Commands

```bash
npm run playwright:install        # Install browsers (first time)
npm run build                     # Build app (tests run against production build)
npm run playwright:db-reset       # Create DB snapshot with fixtures (requires CARE_BACKEND_DIR)
npm run playwright:db-restore     # Restore clean DB state before re-runs

npx playwright test tests/auth/   # Run a specific directory
npx playwright test -g "test name" # Run by pattern
npx playwright test --headed      # Headed mode for debugging
npx playwright test --ui          # Interactive UI mode
npx playwright show-report        # View last HTML report
```

## Complete Reference

The full guide with all patterns, selectors, helpers, and examples is in the project:

- [Playwright Guide](../../../tests/PLAYWRIGHT_GUIDE.md) — Complete test writing reference including:
  - Test file template and structure
  - Authentication and storage states
  - Form interactions (text, select, combobox, date, radio, checkbox)
  - Advanced selector helpers (`selectFromCommand`, `selectFromValueSet`, `selectFromCategoryPicker`, etc.)
  - Assertions (toast, table, form errors, visibility)
  - Data generation with faker
  - File organization conventions
  - Common pitfalls

**Always read the Playwright Guide before writing tests.**

## File Organization — Mirror the UI Navigation

Test directory structure MUST mirror the application's navigation hierarchy. Match the sidebar/URL structure:

```
tests/
  auth/                                    # /login, /session, /homepage
  admin/                                   # /admin/*
    organizations/                         # /admin/organizations
    roles/                                 # /admin/roles
    valueset/                              # /admin/valueset
    questionnaire/                         # /admin/questionnaire
    tags/                                  # /admin/tags
    patientIdentifierConfig/               # /admin/patient-identifier-config
  billing/                                 # /billing (top-level billing)
  organization/                            # /organization/*
    user/                                  # /organization/.../users
    facility/                              # /organization/.../facilities
    patient/encounter/                     # /organization/.../patient/encounter
  facility/                                # /facility/:id/*
    billing/                               # /facility/:id/billing
    components/                            # Shared facility UI components
    queues/                                # /facility/:id/queues
    services/locations/inventory/          # /facility/:id/services/locations/inventory
    settings/                              # /facility/:id/settings/*
      activityDefinition/                  #   settings > activity definitions
      billing/discount/                    #   settings > billing > discounts
      chargeItemDefinition/                #   settings > charge items
      departments/                         #   settings > departments
      devices/                             #   settings > devices
      general/                             #   settings > general
      locations/                           #   settings > locations
      observationDefinition/               #   settings > observations
      product/                             #   settings > products
      productKnowledge/                    #   settings > product knowledge
      specimenDefinitions/                 #   settings > specimens
      tokenCategory/                       #   settings > token categories
    patient/                               # /facility/:id/patient/*
      patientRegistration.spec.ts          #   patient registration
      patientHome/                         #   patient home/list
      patientDetails/                      #   patient profile tabs
        files/                             #     files tab
        notes/                             #     notes tab
        request/                           #     requests tab
        users/                             #     users tab
      encounter/                           #   encounter context
        careTeam/                          #     care team
        files/drawings/                    #     drawings
        forms/enableWhen/                  #     questionnaire forms
        medicine/                          #     prescriptions
        notes/                             #     encounter notes
        serviceRequests/                   #     service requests
        structuredQuestions/               #     allergy, diagnosis, symptoms, etc.
  profile/                                 # /profile/*
```

**Naming conventions:**
- Directories: camelCase matching the feature (e.g., `activityDefinition/`, `patientDetails/`)
- Files: `featureAction.spec.ts` (e.g., `locationCreation.spec.ts`, `deviceEdit.spec.ts`, `departmentUserManage.spec.ts`) — camelCase, not PascalCase
- Group CRUD operations in the same directory with separate files per action

## Quick Reference

### Test Naming Convention

- Name describes the **expected outcome**, not the action: `"shows error when name is empty"` not `"test empty name"`
- Use format: `"<does what> when <condition>"` or `"<verifies outcome> for <scenario>"`
- Must be greppable — avoid generic words like "test", "works", "correct"
- Examples: `"creates location with all fields"`, `"rejects duplicate department name"`, `"displays prefilled data on edit form"`

### Test File Structure

```typescript
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Feature Name", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/locations`);
  });

  test("creates location with valid name and type", async ({ page }) => {
    await test.step("Fill location form", async () => {
      // actions
    });

    await test.step("Verify location appears in list", async () => {
      // assertions
    });
  });
});
```

### Auth Storage States

| Storage State | Role | Username |
|---|---|---|
| `tests/.auth/user.json` | Admin | `admin` |
| `tests/.auth/facilityAdmin.json` | Facility Admin | `care-fac-admin` |
| `tests/.auth/nurse.json` | Nurse | `care-nurse` |

These files are generated (gitignored) by setup specs in `tests/setup/*.setup.ts`. If you hit a missing storage-state file error, run the auth setup first (for example: `npx playwright test tests/setup/auth.setup.ts`).

### Key Helpers (from `tests/helper/ui`)

- `expectToast(page, "message")` — Assert toast notification
- `selectFromCommand(page, trigger, { search, itemIndex })` — User/service picker
- `selectFromValueSet(page, trigger, { search, itemIndex })` — Code/body site picker
- `selectFromFilterSelect(page, /label/i, "value")` — Filter select
- `getFieldErrorMessage(locator)` — Get form field error (from `tests/helper/error`)

### Critical Rules

1. **Use `faker` for data you create in tests** (entity names, notes, and random array selection for generated values). For selecting existing fixture-backed options (usernames, body sites, etc.), use shared constants in `tests/helper/commonConstants.ts` — avoid scattered hardcoded literals
2. **Always use deterministic fixture IDs** — use `getFacilityId()`, `getPatientId()`, `getEncounterId()` from `tests/support/` for navigation. NEVER select a random encounter/patient/facility from a list in the UI — random selection causes flakiness when data changes between runs
3. Always include `test.use({ storageState })` for authenticated flows (omit only for explicit public/auth-page tests)
4. Use `exact: true` on selectors when partial matches are possible
5. **`.first()` only after searching/filtering** — use `.first()` only when you've searched a list and are selecting from filtered results. Never use it to randomly pick from an unfiltered list
6. Use `test.step()` to organize test actions
7. Place tests in matching feature directory under `tests/`
8. **Verify API responses on form submission** — when feasible, wait for and assert the API response (status code) using `page.waitForResponse()`. Skip if the form triggers multiple chained calls or the response isn't meaningful to assert
9. **Verify page navigation** — after navigating to a new page, assert a heading or unique element is visible to confirm the page fully loaded
10. **Wait for specific UI indicators over hardcoded timeouts** — prefer waiting for a visible element or API response instead of arbitrary `{ timeout: N }` values. Use `page.waitForLoadState("networkidle")` only when no better signal exists (it can be flaky with polling/websockets)
11. **Never add custom test IDs to source code** — never add `data-testid` or any custom attribute to the application code for test targeting. Tests must use existing roles, labels, text, accessible selectors, and existing `data-slot` attributes (these are part of shadcn/ui's component architecture, not added for testing)
12. **Verify in-page generated content** — when something is generated without page change (QR codes, tokens, etc.), always assert both element visibility AND the corresponding API request/response
13. **Prefer constants over duplication** — extract reusable values (known usernames, body sites, common options) into shared constants in `tests/helper/` to avoid duplicates across tests
14. **Verify locally before pushing** — always run the specific test file(s) locally with `npx playwright test <path>` and confirm they pass before pushing code
15. **3-strike rule: ask for human help** — if a test keeps failing after 3 AI fix attempts, stop and ask the user to manually inspect the UI. The AI may be missing a visual detail, animation, or dynamic behavior that only a human can verify
16. **Do not touch CI/CD YAML** — never modify GitHub Actions workflow files or CI configuration unless explicitly asked to do so. If a test requires a new `.env` variable that works locally, ALERT the human that CI/CD YAML may need updating for it to work in pipelines.
17. **Never use `test.skip()` or conditional skips to hide failures** — if a test is failing, fix it. Never add `.skip()`, `test.fixme()`, or `if` conditions to bypass a failure. These create false positives where the suite appears green but functionality is broken. Only use `.skip()` for genuinely unsupported environments (e.g., OS-specific) with a clear comment explaining why.
18. **Continuously improve this skill** — capture improvements as follow-up changes through a separate human-reviewed PR; do not self-modify the skill during normal test generation.

## Mindset: Senior QA Engineer

When writing tests, think as a senior QA engineer — question every decision, challenge every assumption, and choose the best approach possible:

- **Test user journeys, not implementation** — focus on what the user sees and does, not internal state
- **Cover edge cases** — empty states, boundary values, error states, permission denied, network failures
- **Test both happy path and unhappy path** — form validation errors, unauthorized access, concurrent operations
- **Always include negative tests** — submit forms with missing required fields, enter invalid data formats, attempt actions without permissions, test API error responses (4xx/5xx), verify proper error messages are shown to the user
- **Assert what matters** — verify the outcome the user cares about, not incidental DOM structure
- **Think about test isolation** — each test must be independent; never rely on another test's side effects
- **Consider accessibility** — if a screen reader can't reach it, neither should your test (use roles, labels, not CSS selectors)
- **Regression-first** — when fixing a bug, write the test that would have caught it before fixing the code
- **Data boundaries** — test with minimum valid input, maximum valid input, and just-beyond-boundary invalid input
- **State transitions** — verify the UI correctly reflects state changes (loading → loaded, enabled → disabled, empty → populated)

### Form Testing Checklist

Every form MUST have tests covering:

1. **Required field validation** — submit with all fields empty, verify each required field shows an error
2. **All fields filled (happy path)** — submit with all valid data, verify success
3. **Field combinations** — submit with only some required fields filled, verify correct errors appear for missing ones
4. **Error message validation** — assert exact error text matches for each validation rule (min length, format, required, etc.)
5. **Individual field update (edit forms)** — verify editing one field doesn't corrupt other fields. Test the full edit flow; don't reload per field (that's for unit tests)
6. **Field-level validation** — test invalid formats (email, phone, date), boundary values (min/max length), special characters
7. **Form reset/cancel** — verify cancel doesn't save, form resets properly
8. **Duplicate submission prevention** — verify button disables after click, no double-submit
9. **Post-submission verification (mandatory)** — after every successful form submit, ALWAYS verify ALL of these:
   - Toast notification appears with correct message
   - URL/path changes to the expected destination
   - The newly created/updated data is visible on the redirected page (card, table row, detail view)
   - Never stop at just the submit click — the test is incomplete without confirming the data landed correctly
10. **Edit form prefill verification** — when opening an edit form, always assert that existing data is prefilled in all fields before making changes

## Patterns

### Debugging Failing Tests

```bash
# Run with trace viewer (captures screenshots, network, console)
npx playwright test tests/path/to/test.spec.ts --trace on

# Run in debug mode (step through with Playwright Inspector)
npx playwright test tests/path/to/test.spec.ts --debug

# Run headed to visually see what's happening
npx playwright test tests/path/to/test.spec.ts --headed

# View HTML report from last run
npx playwright show-report

# Open a trace zip directly (if available)
npx playwright show-trace test-results/<run-id>/trace.zip
```

When a test fails:
1. Check the HTML report (`npx playwright show-report`) for screenshots and trace
2. Run with `--headed` to visually observe the failure
3. Use `--debug` to step through interactively
4. Check if DB state is stale — run `npm run playwright:db-restore`

**Flakiness triage (passes sometimes, fails sometimes):**
- **Timing/race condition** → element appears before data loads. Fix: wait for API response or specific text, not `networkidle`
- **Animation/transition** → click happens mid-animation. Fix: wait for element to be stable (`await locator.waitFor({ state: 'visible' })`) before acting
- **Parallel data collision** → two tests create same faker value. Fix: use `Date.now()` suffix or more specific faker seeds
- **Stale DB state** → previous test left data behind. Fix: `npm run playwright:db-restore` or restructure to not depend on clean state
- **Polling/WebSocket** → `networkidle` never resolves. Fix: wait for specific DOM change instead

### API Response Verification on Form Submit

```typescript
await test.step("Submit and verify API response", async () => {
  const responsePromise = page.waitForResponse(
    (resp) =>
      resp.url().includes("/api/v1/facility/") && resp.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Create" }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);
});
```

### Page Load Verification After Navigation

```typescript
// After clicking a link or submitting that navigates
// Prefer asserting a visible element directly (auto-waits up to timeout)
await expect(
  page.getByRole("heading", { name: "Facility Overview" }),
).toBeVisible();

// Only use networkidle as last resort when no specific element to wait for
// await page.waitForLoadState("networkidle");
```

### Parallel vs Serial Execution

```typescript
// DEFAULT: Tests run in parallel and are independent — prefer this always
test.describe("Location validations", () => {
  test("shows error for empty name", async ({ page }) => { /* ... */ });
  test("shows error for duplicate slug", async ({ page }) => { /* ... */ });
});

// AVOID: serial creates hidden dependencies and increases flakiness.
// Only use when a single logical flow MUST share state (rare).
// If you need serial, consider making it ONE test with multiple steps instead.
test.describe("Location CRUD", () => {
  test.describe.configure({ mode: "serial" });
  test("create location", async ({ page }) => { /* ... */ });
  test("edit location", async ({ page }) => { /* ... */ });
  test("delete location", async ({ page }) => { /* ... */ });
});
```

### `.fill()` vs `.pressSequentially()` — IMPORTANT

- **`.fill()`** clears the field first, then sets the value. Use for fresh input.
- **`.pressSequentially()`** types character by character WITHOUT clearing — appends to existing data.
- AI often confuses these. Be explicit:

```typescript
// CORRECT: Clear and type fresh value
await page.getByRole("textbox", { name: "Name" }).fill("New Value");

// CORRECT: Type along with existing data (e.g., slug auto-generation, search)
await page.getByRole("textbox", { name: "Name" }).pressSequentially("appended text");

// WRONG: Using fill() when you want to append
// WRONG: Using pressSequentially() when you want to replace
```

### Direct API Calls for Test Setup

Use `fetch()` for creating precondition data without going through UI:

```typescript
import { getFacilityId } from "tests/support/facilityId";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

async function createAccountViaApi() {
  const facilityId = getFacilityId();
  const res = await fetch(`${getApiUrl()}/api/v1/facility/${facilityId}/account/`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify({ name: "Test Account", type: "income" }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create account: ${res.status}`);
  }
  return res.json();
}

// Call inside a test or hook — never at module top level
test.beforeEach(async () => {
  const account = await createAccountViaApi();
  // ... use account in the test
});
```

### Promise.all() for Parallel Navigation + API Wait

The wait promise MUST be listed first so the response listener is registered before the action that triggers the request — otherwise the request can fire before Playwright is listening, causing a flaky timeout.

```typescript
await Promise.all([
  page.waitForResponse(
    (resp) =>
      resp.url().includes("/medication/prescription/") &&
      resp.status() === 200,
  ),
  page.getByRole("tab", { name: "Medicines" }).click(),
]);
```

### data-slot Selectors

Components use `data-slot` attributes for stable targeting:

```typescript
// Table
await expect(page.locator('[data-slot="table-body"]')).toContainText(name);
await page.locator('[data-slot="table-row"]').first().click();

// Badge
await expect(page.locator('[data-slot="badge"]').filter({ hasText: "Active" })).toBeVisible();

// Collapsible
const card = page.locator('[data-slot="collapsible"]').filter({ hasText: "Lab Tests" });
await card.locator('[data-slot="collapsible-trigger"]').click();

// Command input (search fields)
const scope = page;
const input = scope.locator('[data-slot="command-input"]').first();
await input.fill("");       // Clear first
await input.fill(search);   // Then fill
```

### Helper Function Extraction Pattern

Extract reusable form logic into local helpers that return generated data:

```typescript
import type { Page } from "@playwright/test";

async function createEntity(page: Page, options: { name: string; type: string }) {
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(options.name);
  await page.getByRole("combobox", { name: "Type" }).click();
  await page.getByRole("option", { name: options.type }).first().click();
  await page.getByRole("button", { name: "Submit" }).click();
  return options; // Return so test can assert against it
}
```

### Cascading/Dependent Form Elements

Handle comboboxes that appear based on previous selection:

```typescript
const region = page;
let previousCount = 0;
const MAX_CASCADES = 10;

for (let iteration = 0; iteration < MAX_CASCADES; iteration++) {
  const comboboxes = region.getByRole("combobox");
  const count = await comboboxes.count();
  if (count === previousCount) break;
  const combobox = comboboxes.nth(count - 1);
  await combobox.click();
  await page.getByRole("option").first().click();
  previousCount = count;

  if (iteration === MAX_CASCADES - 1) {
    throw new Error(
      `Cascading comboboxes exceeded ${MAX_CASCADES} iterations - possible loop`,
    );
  }
}
```

### Phone Number Generation (Indian Format)

```typescript
const phoneNumber = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;
```

### Dismiss Stray Popovers

```typescript
import { closeAnyOpenPopovers } from "tests/helper/ui";
await closeAnyOpenPopovers(page);
```

### Eventually-Consistent Assertions (`expect.toPass()`)

For UI that updates asynchronously (e.g., list refreshes after creation):

```typescript
await expect(async () => {
  await expect(page.getByRole("table").getByText(createdName)).toBeVisible();
}).toPass({ timeout: 10000 });
```

Use when the data appears after a short delay due to cache invalidation or refetch.

### File Upload & Camera

For file upload inputs, use `setInputFiles()`:

```typescript
// Standard file upload
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles("tests/fixtures/sample_file.xlsx");

// Camera/image capture (mimic by uploading an image file)
await fileInput.setInputFiles("tests/fixtures/images/test-image.jpg");
```

Camera inputs are tested by uploading a fixture image file — no actual camera simulation needed. Always verify:
- The uploaded file name/thumbnail appears in the UI
- The API request for upload returns success

### Delete with Double Confirmation

Destructive actions typically require two confirmations. Always verify BOTH:

```typescript
const entityName = "<entity name>";

await test.step("Delete with double confirmation", async () => {
  // First: click delete button
  await page.getByRole("button", { name: "Delete" }).click();

  // First confirmation dialog
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();

  // Second confirmation (if present — e.g., type entity name)
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("textbox").fill("confirm");
  await page.getByRole("button", { name: "Delete" }).click();

  // Verify deletion
  await expectToast(page, /deleted successfully/i);
  await expect(page.getByText(entityName)).not.toBeVisible();
});
```

Never skip a confirmation step — verify both dialogs appear and require interaction.

### Network Mocking (`page.route()`)

Use for testing error states without needing the backend to fail:

```typescript
// Mock a 500 error
await page.route("**/api/v1/facility/*/", (route) =>
  route.fulfill({ status: 500, body: JSON.stringify({ detail: "Server Error" }) }),
);

// Mock network timeout
await page.route("**/api/v1/facility/*/", (route) => route.abort("timedout"));

// Remove mock after test
await page.unroute("**/api/v1/facility/*/");
```

Use sparingly — prefer real backend responses. Only mock when testing specific error UI that's hard to trigger naturally.

### Multiple User Roles in a Single Test

When a workflow requires actions from different users (e.g., admin creates, nurse verifies), use `browser.newContext()` with different storage states:

```typescript
import { expect, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test("Admin assigns task, nurse sees it", async ({ browser }) => {
  const facilityId = getFacilityId();

  // Admin context — close in `finally` so a failing step still releases the context
  const adminContext = await browser.newContext({
    storageState: "tests/.auth/user.json",
  });
  try {
    const adminPage = await adminContext.newPage();
    await test.step("Admin creates assignment", async () => {
      await adminPage.goto(`/facility/${facilityId}/...`);
      // ... admin actions
    });
  } finally {
    await adminContext.close();
  }

  // Nurse context
  const nurseContext = await browser.newContext({
    storageState: "tests/.auth/nurse.json",
  });
  try {
    const nursePage = await nurseContext.newPage();
    await test.step("Nurse verifies assignment", async () => {
      await nursePage.goto(`/facility/${facilityId}/...`);
      await expect(nursePage.getByText("Assigned Task")).toBeVisible();
    });
  } finally {
    await nurseContext.close();
  }
});
```

Always close each context after use. Use `{ browser }` fixture instead of `{ page }` when switching users.

### Keep Tests Independent

- Each test MUST be runnable in isolation — never depend on another test's side effects
- Use `test.describe.configure({ mode: "serial" })` only when tests share a logical CRUD flow (create → edit → delete) within the SAME describe block
- If a test needs precondition data, create it in `beforeEach`/`beforeAll` or via direct API calls — never assume a previous test created it
- Tests in DIFFERENT files must NEVER depend on each other
- **Encounter limit awareness** — a patient can have only 5 live encounters at a time. If your test creates encounters or selects existing ones, ensure you mark them as completed (via API or UI) after use. Failing to do so causes flaky failures when the limit is reached across test runs.
