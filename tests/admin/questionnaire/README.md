# Questionnaire Status Management Tests

## Overview

This directory contains Playwright E2E tests for questionnaire status management functionality, specifically testing how questionnaire status changes (active, retired, draft) affect their availability in patient encounters.

## Test Files

### `questionnaire.spec.ts`

This test file is a Playwright equivalent of the Cypress test located at `cypress/e2e/dashboard_spec/questionnaire.cy.ts`.

#### Tests

The file contains three independent tests, one for each questionnaire status:

**1. "retired questionnaire should not be available in encounter"**

- Sets questionnaire status to "retired"
- Verifies questionnaire is NOT available when trying to add to encounter
- Expects "No Results Found" message

**2. "draft questionnaire should not be available in encounter"**

- Sets questionnaire status to "draft"
- Verifies questionnaire is NOT available when trying to add to encounter
- Expects "No Results Found" message

**3. "active questionnaire should be available in encounter"**

- Sets questionnaire status to "active"
- Verifies questionnaire IS available when trying to add to encounter
- Can successfully add questionnaire to encounter

#### Test Flow (Each Test)

1. **Setup**
   - Uses `beforeAll` hook to navigate to questionnaire admin once
   - Saves questionnaire URL for reuse across tests

2. **Navigate to Encounter**
   - Gets facility ID using `getFacilityId()` helper
   - Navigates directly to encounters list with URL filters:
     - Date range: Last 90 days
     - Status: in-progress
   - Opens first encounter and clicks "Update Encounter"

3. **Change Questionnaire Status**
   - Navigates to saved questionnaire URL
   - Clicks status radio button (retired/draft/active)
   - Clicks "Save" button
   - Waits for "Questionnaire updated successfully" notification

4. **Verify Availability**
   - Goes back to encounter page
   - Clicks "Add Form" combobox
   - Types questionnaire name
   - Verifies availability based on status:
     - Retired/Draft: "No Results Found" appears
     - Active: Questionnaire option is visible and clickable

## Running the Tests

### Prerequisites

- Node.js 22+ installed
- Local backend server running (see [CARE backend setup](https://github.com/ohcnetwork/care#self-hosting))
- Environment variable `REACT_CARE_API_URL` configured

### Build the Application

```bash
npm run build
```

### Run Playwright Tests

```bash
# Run all Playwright tests
npm run playwright:test

# Run only questionnaire tests
npx playwright test tests/admin/questionnaire

# Run with UI mode for debugging
npm run playwright:test:ui

# Run in headed mode to see browser
npm run playwright:test:headed
```

### View Test Reports

```bash
npm run playwright:show-report
```

## Key Differences from Cypress Test

### Test Structure

- **Cypress:** Single test with sequential status changes
- **Playwright:** Three separate, independent tests (one per status)
- **Benefit:** Reduces flakiness, easier to debug, tests can run in parallel

### Locator Strategy

- **Cypress:** Used `data-cy` attributes (e.g., `data-cy="add-questionnaire-button"`)
- **Playwright:** Uses semantic locators:
  - `getByRole("combobox")` for questionnaire selector
  - `getByRole("button", { name: /save/i })` for save button
  - `getByText("View Encounter")` for navigation links
  - `getByPlaceholder(/search/i)` for search inputs
- **Benefit:** More resilient to implementation changes, better accessibility

### Navigation

- **Cypress:** Manual navigation through UI (clicks facility, sidebar, filters)
- **Playwright:** Direct URL navigation with query parameters
  ```typescript
  `/facility/${facilityId}/encounters/patients/all?created_date_after=${date}&status=in-progress`;
  ```
- **Benefit:** Faster test execution, more reliable

### Facility Selection

- **Cypress:** `facilityCreation.selectFirstRandomFacility()` - clicks UI
- **Playwright:** `getFacilityId()` - uses stored facility ID from setup
- **Benefit:** Reuses setup work, faster execution

### Waiting Strategy

- **Cypress:** Custom commands with implicit waits
- **Playwright:** Element-based explicit waits
  - `page.getByRole("button").first().waitFor()` - waits for element to appear
  - Implicit auto-waiting on all locator actions
  - No `waitForTimeout()` calls
- **Benefit:** More deterministic, less flaky

### Authentication

- **Cypress:** `cy.loginByApi("superadmin")` custom command
- **Playwright:** `test.use({ storageState: "tests/.auth/user.json" })` for authenticated state
- **Benefit:** Faster - reuses authentication across tests

## Test Data Requirements

The test requires:

- At least one facility with active patients
- At least one in-progress encounter
- The "Respiratory Support" questionnaire must exist in the system
- Admin user credentials for authentication

## Troubleshooting

### Test Fails: "No in-progress encounters found"

**Solution:** Create at least one in-progress encounter before running the test.

### Test Fails: "Questionnaire not found"

**Solution:** Ensure the "Respiratory Support" questionnaire exists in your test database.

### Authentication Issues

**Solution:** Re-run the auth setup: `npx playwright test tests/setup/auth.setup.ts`

## Contributing

When modifying this test:

1. Follow existing Playwright patterns from other tests in the repository
2. Use semantic locators (`getByRole`, `getByText`) when possible
3. Add comments explaining complex interactions
4. Ensure the test maintains parity with the original Cypress test
5. Run linting and formatting: `npm run format && npm run lint`

## Related Files

- **Original Cypress Test:** `cypress/e2e/dashboard_spec/questionnaire.cy.ts`
- **Cypress Page Objects:**
  - `cypress/pageObject/dashboard/Questionnaire.ts`
  - `cypress/pageObject/Patients/PatientEncounter.ts`
  - `cypress/pageObject/facility/FacilityCreation.ts`
- **Playwright Config:** `playwright.config.ts`
- **Auth Setup:** `tests/setup/auth.setup.ts`

## License

MIT - See LICENSE file in repository root
