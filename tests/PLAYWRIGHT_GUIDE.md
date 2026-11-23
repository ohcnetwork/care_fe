# Playwright Test Writing Guide

This guide contains everything needed to write Playwright E2E tests for CARE. It is designed for both human developers and AI agents.

## Quick Start

```bash
# First time setup
npm run playwright:install        # Install browsers
npm run build                     # Build the app (required — tests run against production build)
npm run playwright:db-reset       # Create DB snapshot with fixtures (requires CARE_BACKEND_DIR)

# Run tests (backend must be running on port 9000)
npx playwright test tests/auth/   # Run a specific directory
npx playwright test --workers=4   # Run with parallelism

# Re-run (DB auto-restores from snapshot)
npx playwright test tests/auth/   # Just run again — clean state guaranteed
```

## Test File Template

Every test file follows this exact structure:

```typescript
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// REQUIRED: Use authenticated storage state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Feature Name", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/locations`);
  });

  test(
    "descriptive test name",
    { tag: ["@atomic", "@cap:location.create"] },
    async ({ page }) => {
      await test.step("Step 1: Fill form", async () => {
        // actions
      });

      await test.step("Step 2: Verify result", async () => {
        // assertions
      });
    },
  );
});
```

## Tags, capabilities and step functions

Every test is tagged with the **capability** it verifies and its **class**. The tags drive [`ATOMIC_TEST_INDEX.md`](ATOMIC_TEST_INDEX.md), which maps each capability to its tests and its reusable step, and let you run slices of the suite (`npx playwright test --grep @workflow`, `--grep @cap:billing`).

```typescript
test(
  "should register a new patient",
  { tag: ["@atomic", "@cap:patient.register"] },
  async ({ page }) => { … },
);

test(
  "keeps the chosen encounter across sections",
  {
    tag: ["@coupled", "@cap:encounter.navigate"],
    annotation: { type: "coupled", description: "Serial describe sharing one encounter" },
  },
  async ({ page }) => { … },
);
```

| Tag                 | Meaning                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `@cap:<domain>.<…>` | Exactly one per test: the user intent under test, e.g. `@cap:encounter.create`. Register new ids in [`capabilities.ts`](capabilities.ts). |
| `@atomic`           | One capability; runs alone with only setup fixtures plus its own arrange.                                                                 |
| `@coupled`          | One capability, but depends on order, shared state or the environment. Needs `annotation: { type: "coupled", description }`.              |
| `@journey`          | Verifies two or more capabilities in one test. Needs `annotation: { type: "journey", description }` listing what it chains.               |
| `@workflow`         | A test in `tests/workflows/` composed from step functions.                                                                                |
| `@mocked` / `@unit` | Optional: the behaviour under test runs on stubbed API responses, so nothing persists / no browser at all.                                |

Tags must be string literals; the index generator reads them from the source. After adding, removing, renaming or retagging a test, run `npm run playwright:index` and commit `ATOMIC_TEST_INDEX.md`. CI runs `npm run playwright:index:check`, which fails on a missing or unregistered tag or a stale index.

**Step functions.** An action a workflow may reuse (register a patient, create an encounter, record a payment) belongs in `tests/helper/<domain>.ts`, not inside a spec:

- Name UI steps `<verb><Entity>ViaUi(page, input)` and API seeders `<verb><Entity>ViaApi(input)`.
- Take one options object, and return the ids it produced (`Promise<{ encounterId: string }>`).
- Wrap the body in `test.step("<capability>", …, { box: true })` so reports show the step name.
- Wait only for proof the action succeeded (toast, URL, response); keep content assertions in the test.
- Record the step in the capability's `step` field in `capabilities.ts`.

**Isolated data.** Tests that write data should not touch the shared fixture patient, encounter or account, or "the first in-progress encounter in the list". Import `test` from `tests/support/test` to get per-test fixtures:

```typescript
import { expect, test } from "tests/support/test";

test(
  "…",
  { tag: ["@atomic", "@cap:encounter.consent.create"] },
  async ({ page, facilityId, isolatedEncounter }) => {
    const { patientId, encounterId } = isolatedEncounter; // fresh API patient with an in-progress encounter
  },
);
```

**Workflow tests** live in `tests/workflows/` and chain step functions, passing each step's output to the next:

```typescript
const { patientId } = await registerPatientViaUi(page, { facilityId });
const { encounterId } = await createEncounterViaUi(page, {
  facilityId,
  patientId,
});
await changeEncounterStatusViaUi(page, {
  facilityId,
  patientId,
  encounterId,
  status: "Completed",
});
```

## Authentication

Use one of these storage states depending on the role needed:

| Storage State                    | Role           | Credentials                   |
| -------------------------------- | -------------- | ----------------------------- |
| `tests/.auth/user.json`          | Admin          | `admin` / `admin`             |
| `tests/.auth/facilityAdmin.json` | Facility Admin | `care-fac-admin` / `Ohcn@123` |
| `tests/.auth/nurse.json`         | Nurse          | `care-nurse` / `Ohcn@123`     |
| `tests/.auth/staff.json`         | Staff          | `care-staff` / `Ohcn@123`     |

```typescript
// Most tests use admin
test.use({ storageState: "tests/.auth/user.json" });

// Nurse-specific tests
test.use({ storageState: "tests/.auth/nurse.json" });
```

## Available IDs from Setup

```typescript
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";
import { getEncounterId } from "tests/support/encounterId";
import { getAccountId } from "tests/support/accountId";

// Use in beforeEach or test body
const facilityId = getFacilityId();
const patientId = getPatientId();
const encounterId = getEncounterId();
const accountId = getAccountId();
```

## Common URLs

```text
// Facility pages
/facility/${facilityId}/overview
/facility/${facilityId}/settings/locations
/facility/${facilityId}/settings/departments
/facility/${facilityId}/settings/devices
/facility/${facilityId}/settings/services
/facility/${facilityId}/users

// Patient pages
/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}
/facility/${facilityId}/patient/${patientId}/profile
/facility/${facilityId}/encounters

// Admin pages
/admin/questionnaires
/admin/valuesets
```

## Data Generation

ALWAYS use faker or timestamps for unique data. NEVER hardcode entity names.

```typescript
import { faker } from "@faker-js/faker";

// Names
const name = faker.company.name();
const departmentName = faker.word.words(2);
const description = faker.lorem.sentence();

// With timestamp for guaranteed uniqueness
const uniqueName = `Test ${Date.now()}`;

// Random selection from options
const status = faker.helpers.arrayElement(["Active", "Inactive"]);

// Phone numbers (Indian format)
const phone = `9${Math.floor(Math.random() * 1000000000)
  .toString()
  .padStart(9, "0")}`;

// Slugs (auto-generated from names in the app)
import { expectedSlug } from "tests/helper/utils";
const slug = expectedSlug(name); // lowercase, hyphens, max 25 chars

// Non-existent search term (for testing "no results")
const nonExistent = faker.string.uuid();
```

## Form Interactions

### Text Input

```typescript
await page.getByRole("textbox", { name: "Name" }).fill("value");

// For inputs that need keystroke simulation (e.g., slug auto-generation)
await page.getByRole("textbox", { name: "Name" }).pressSequentially("value");
```

### Select / Combobox

```typescript
await page.getByRole("combobox", { name: "Status", exact: true }).click();
await page.getByRole("option", { name: "Active" }).first().click();
```

**IMPORTANT:** Use `exact: true` when the label might partially match other elements. Use `.first()` on options when multiple matches are possible.

### Radio Button

```typescript
await page.getByRole("radio", { name: "Male", exact: true }).click();
```

### Checkbox

```typescript
await page.getByRole("checkbox", { name: "Create Multiple Beds" }).click();
```

### Number Input

```typescript
await page.getByRole("spinbutton", { name: "PIN Code" }).fill("302020");
```

### Date Input (DD/MM/YYYY fields)

```typescript
await page.getByPlaceholder("DD", { exact: true }).fill("16");
await page.getByPlaceholder("MM", { exact: true }).fill("06");
await page.getByPlaceholder("YYYY", { exact: true }).fill("2009");
```

### Tab Navigation

```typescript
await page.getByRole("tab", { name: "Age" }).click();
```

## Advanced Selectors (Helper Functions)

Import from `tests/helper/ui`:

### Command Selector (User picker, Service picker)

```typescript
import { selectFromCommand } from "tests/helper/ui";

const trigger = page.getByRole("combobox", { name: "Practitioner" });
await selectFromCommand(page, trigger, {
  search: "doctor",
  itemIndex: 0,
});
```

### ValueSet Selector (Codes, body sites, diagnostic codes)

```typescript
import { selectFromValueSet } from "tests/helper/ui";

const trigger = page.getByRole("combobox", { name: "Body Site" });
await selectFromValueSet(page, trigger, {
  search: "deltoid",
  itemIndex: 0,
});
```

### Requirements Selector (Multi-select with Plus buttons)

```typescript
import { selectFromRequirements } from "tests/helper/ui";

const trigger = page.getByRole("combobox", { name: "Specimen Requirements" });
await selectFromRequirements(page, trigger, {
  search: "blood",
  itemIndex: 0,
});
```

### Location Multi-Select

```typescript
import { selectFromLocationMultiSelect } from "tests/helper/ui";

const trigger = page.getByRole("button", { name: "Select Locations" });
await selectFromLocationMultiSelect(page, trigger, {
  search: "Ward",
  itemIndex: 0,
  closeAfterSelect: true,
});
```

### Category Picker (Hierarchical navigation)

```typescript
import { selectFromCategoryPicker } from "tests/helper/ui";

const trigger = page.getByRole("combobox", { name: "Activity" });
await selectFromCategoryPicker(page, trigger, {
  navigateCategories: ["Lab Tests", "Blood Tests"],
  itemIndex: 0,
});
```

### Filter Select

```typescript
import { selectFromFilterSelect } from "tests/helper/ui";

await selectFromFilterSelect(page, /status/i, "active");
```

### Tab or Menu Item (responsive)

```typescript
import { clickTabOrMenuItem } from "tests/helper/ui";

await clickTabOrMenuItem(page, /service requests/i);
```

## Assertions

### Toast Notifications

```typescript
import { expectToast } from "tests/helper/ui";

await expectToast(page, "Location Created");
await expectToast(page, /created successfully/i);

// With custom timeout
await expectToast(page, "Saved", { timeout: 15000 });
```

### Form Field Errors

```typescript
import { getFieldErrorMessage } from "tests/helper/error";

const nameField = page.getByRole("textbox", { name: "Name" });
await expect(getFieldErrorMessage(nameField)).toContainText(
  "This field is required",
);
```

### Table Content

```typescript
const tableBody = page.locator('[data-slot="table-body"]');
await expect(tableBody).toContainText("expected text");
await expect(tableBody).toContainText(status);

// Click a row
await page.locator('[data-slot="table-body"] tr').first().click();

// Find specific row
await page.getByRole("row").filter({ hasText: departmentName }).click();
```

### Table Badges

```typescript
import { verifyTableBadges } from "tests/helper/ui";

await verifyTableBadges(page, "Active", "My Item Name");
```

### Visibility

```typescript
await expect(element).toBeVisible();
await expect(element).toBeVisible({ timeout: 10000 });
await expect(element).not.toBeVisible();
```

### Values

```typescript
await expect(element).toHaveValue("expected value");
await expect(element).toContainText("partial text");
await expect(element).toBeDisabled();
await expect(element).toBeEnabled();
```

## Buttons and Actions

### Submit / Create

```typescript
await page.getByRole("button", { name: "Create" }).click();
await page.getByRole("button", { name: "Save" }).click();
await page.getByRole("button", { name: "Submit" }).click();
```

### Edit

```typescript
// Button with title attribute
await page.locator("button[title='Edit Location']").first().click();

// Button with role and name
await page.getByRole("button", { name: /Edit/i }).click();
```

### Delete / Destructive

```typescript
await page.getByRole("button", { name: "Delete" }).click();
// Confirm in dialog
await page.getByRole("button", { name: "Confirm" }).click();
```

### Cancel

```typescript
await page.getByRole("button", { name: "Cancel" }).click();
```

## Navigation

### URL Navigation

```typescript
await page.goto(`/facility/${facilityId}/settings/locations`);
```

### Sidebar

```typescript
// The sidebar may already be expanded; only expand it when collapsed.
const sidebarToggle = page.getByRole("button", {
  name: "Toggle Sidebar",
  exact: true,
});
if ((await sidebarToggle.getAttribute("aria-expanded")) !== "true") {
  await sidebarToggle.click();
}
await page.getByRole("link", { name: /search patients/i }).click();
```

### Link Click

```typescript
await page.getByRole("link", { name: "View Profile" }).click();
```

### Wait for Navigation

```typescript
await page.waitForURL(/\/facility\/[^/]+\/overview$/);
await page.waitForURL("**/patients/**", { timeout: 10000 });
```

## Extracting Page Helpers (Recommended Pattern)

For complex pages, extract form helpers as local functions:

```typescript
test.describe("Department Creation", () => {
  // Extract form interaction into helpers
  async function openCreateForm(page: Page) {
    await page
      .getByRole("button", { name: "Add Department/Team" })
      .first()
      .click();
  }

  async function fillForm(
    page: Page,
    options: { name?: string; type?: string },
  ) {
    if (options.name) {
      await page
        .getByRole("textbox", { name: "Name" })
        .pressSequentially(options.name);
    }
    if (options.type) {
      await page.getByRole("combobox", { name: "Type" }).click();
      await page.getByRole("option", { name: options.type }).first().click();
    }
  }

  async function submitForm(page: Page) {
    await page.getByRole("button", { name: "Create Organization" }).click();
  }

  // Tests become clean and readable
  test("Create a department", async ({ page }) => {
    const name = faker.word.words(2);
    await openCreateForm(page);
    await fillForm(page, { name, type: "Department" });
    await submitForm(page);
    await expectToast(page, "Organization created successfully");
  });
});
```

## File Organization

Place test files in the matching feature directory:

```
tests/
  auth/                           # Login, session tests
  admin/
    roles/                        # Role CRUD tests
    valueset/                     # ValueSet tests
    questionnaire/                # Questionnaire tests
  facility/
    settings/
      locations/                  # Location CRUD
      departments/                # Department CRUD
      devices/                    # Device CRUD
      services/                   # Service tests
    patient/
      encounter/                  # Encounter tests
      patientDetails/             # Patient detail tests
      patientRegistration.spec.ts # Registration flow
    users/                        # User management
  organization/                   # Org management
  profile/                        # User profile tests
```

Name files as: `featureName.spec.ts` or `featureAction.spec.ts` (e.g., `locationCreation.spec.ts`, `locationEdit.spec.ts`).

## Common Pitfalls

1. **Missing `exact: true`** — `{ name: "Status" }` matches "Operational Status" too
2. **Missing `.first()`** — Multiple matching elements cause "strict mode violation"
3. **Hardcoded entity names** — Will fail on re-run; always use faker
4. **Not awaiting helpers** — All helper functions are async, must use `await`
5. **Forgetting `test.use({ storageState })`** — Tests will fail with auth errors
6. **Not using `test.step()`** — Makes test reports hard to read
7. **Using custom timeouts** — Avoid hardcoded `{ timeout: 15000 }`. Instead use `page.waitForLoadState("networkidle")` or visibility checks (`expect(locator).toBeVisible()`) to wait for page readiness. Rely on global timeouts from `playwright.config.ts`.
8. **Non-camelCase directory names** — Use camelCase for test directories (e.g., `enableWhen/`, `patientDetails/`), not kebab-case or snake_case.

## Available Constants

```typescript
import { BODY_SITES, KNOWN_USERNAMES } from "tests/helper/commonConstants";

// BODY_SITES: Array of SNOMED body site names for selectFromValueSet
// KNOWN_USERNAMES: ["admin", "care-doctor", "care-nurse", "care-staff", "care-admin", "care-volunteer", "care-fac-admin", "care-role-admin", "care-role-manager", "care-role-member"]
```

## Running Specific Tests

```bash
# Single file
npx playwright test tests/facility/settings/locations/locationCreation.spec.ts

# By grep pattern
npx playwright test -g "Add a new location"

# Single directory
npx playwright test tests/auth/

# With headed browser (for debugging)
npx playwright test --headed tests/auth/login.spec.ts

# With UI mode (interactive)
npx playwright test --ui

# Show last report
npx playwright show-report
```
