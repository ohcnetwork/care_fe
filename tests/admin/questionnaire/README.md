# Questionnaire Status Management Tests

## Overview

This directory contains Playwright E2E tests for questionnaire status management functionality, specifically testing how questionnaire status changes (active, retired, draft) affect their availability in patient encounters.

## Test Files

### `questionnaire.spec.ts`

This test file is a Playwright equivalent of the Cypress test located at `cypress/e2e/dashboard_spec/questionnaire.cy.ts`.

#### Test: "verify questionnaire status functionality in encounter"

**Purpose:** Validates that questionnaire status changes correctly control whether a questionnaire is available to be added to patient encounters.

**Test Flow:**

1. **Navigate to Facility and Encounter**
   - Login with authenticated state
   - Navigate to the first available facility
   - Access "Patients > All Encounters" from sidebar
   - Filter encounters by "In Progress" status
   - Open the first in-progress encounter
   - Navigate to "Update Encounter" page

2. **Add Questionnaire to Encounter**
   - Add the "Respiratory Support" questionnaire to the encounter
   - Save the encounter URL for future navigation

3. **Navigate to Admin Dashboard**
   - Go to homepage
   - Click "Admin Dashboard"
   - Search for "Respiratory Support" questionnaire
   - Open the questionnaire details page
   - Save the questionnaire URL for future navigation

4. **Test Retired Status**
   - Set questionnaire status to "retired"
   - Save changes and verify success notification
   - Return to the encounter page
   - Attempt to add the questionnaire
   - **Expected:** Questionnaire should NOT be available (shows "No Results Found")

5. **Test Draft Status**
   - Return to questionnaire details page
   - Set questionnaire status to "draft"
   - Save changes and verify success notification
   - Return to the encounter page
   - Attempt to add the questionnaire
   - **Expected:** Questionnaire should NOT be available (shows "No Results Found")

6. **Test Active Status**
   - Return to questionnaire details page
   - Set questionnaire status to "active"
   - Save changes and verify success notification
   - Return to the encounter page
   - Attempt to add the questionnaire
   - **Expected:** Questionnaire SHOULD be available and can be added

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

### Authentication

- **Cypress:** Uses `cy.loginByApi("superadmin")` custom command
- **Playwright:** Uses `test.use({ storageState: "tests/.auth/user.json" })` for authenticated state

### URL Handling

- **Cypress:** Uses aliases with `cy.saveCurrentUrl().as("patientEncounterUrl")`
- **Playwright:** Uses variables: `patientEncounterUrl = page.url()`

### Element Selection

- **Cypress:** Uses custom commands like `cy.verifyAndClickElement()`, `cy.typeAndSelectOption()`
- **Playwright:** Uses native locators: `page.getByRole()`, `page.locator()`, `page.getByText()`

### Waiting Strategy

- **Cypress:** Implicit waiting with custom commands
- **Playwright:** Implicit auto-waiting with locators, explicit `waitForTimeout()` where needed

### Notifications

- **Cypress:** Custom command `cy.verifyNotification()`
- **Playwright:** Direct assertion with `expect(page.locator("li[data-sonner-toast]")...)`

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
