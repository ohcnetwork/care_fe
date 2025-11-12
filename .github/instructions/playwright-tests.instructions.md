---
applyTo: "tests/**/*.{ts,js}"
---

# Playwright E2E Testing Instructions

## Test File Organization (tests/)

Current test directory structure:

- `admin/`: Admin functionality, user management, system configuration (e.g., tags/)
- `auth/`: Authentication flows including login.spec.ts, homepage.spec.ts, authenticated.spec.ts
- `facility/`: Facility-related tests organized by feature:
  - `patient/`: Patient registration (patientRegistration.spec.ts), encounters (encounter.spec.ts)
  - `encounter/`: Clinical encounter workflows
  - `inventory/`: Inventory management tests (inventory.spec.ts)
  - `settings/`: Facility settings and configuration
  - `users/`: User management within facilities
- `organization/`: Organization-level tests like facility creation (facilityCreation.spec.ts)
- `setup/`: Test setup files including auth.setup.ts for authentication state
- `support/`: Shared utilities like facilityId.ts
- `fixtures/`: Test data files (users.json for test accounts, sample files for uploads)

## Playwright Locator Patterns

Playwright recommends using semantic locators for better test maintainability:

```typescript
// ✅ Preferred: Role-based selectors (accessible and semantic)
await page.getByRole("button", { name: /submit/i }).click();
await page.getByRole("textbox", { name: /patient name/i }).fill("John Doe");
await page.getByRole("combobox", { name: /facility type/i }).click();

// ✅ Good: Label-based selectors (accessible forms)
await page.getByLabel(/password/i).fill("secure123");
await page.getByLabel("Date of Birth").fill("1980-01-15");

// ✅ Good: Text-based selectors (for links and buttons)
await page.getByText("Create Patient").click();
await page.getByText(/facility created successfully/i).toBeVisible();

// ⚠️ Use sparingly: data-cy selectors (only when semantic locators are insufficient)
// Example: Complex custom dropdowns without proper ARIA roles
const stateCombobox = stateRegion.locator('[data-cy="select-state"]');

// ❌ Avoid: CSS class selectors (brittle and non-semantic)
await page.locator(".submit-button").click();
```

## Healthcare-Specific Test Patterns

```typescript
// Example: Patient registration flow using semantic locators
test("should register a new patient", async ({ page }) => {
  // Navigate using accessible selectors
  await page.getByRole("link", { name: /search patients/i }).click();
  
  // Trigger registration with keyboard shortcut
  await page
    .getByRole("textbox", { name: /search by patient phone number/i })
    .press("Shift+Enter");

  // Fill form using semantic locators
  await page.getByRole("textbox", { name: /name.*\*/i }).fill("John Doe");
  await page.getByRole("textbox", { name: /phone number.*\*/i }).fill("9123456789");
  await page.getByRole("radio", { name: "Male", exact: true }).click();

  // Submit and verify
  await page.getByRole("button", { name: /register patient/i }).click();
  await expect(page.getByText(/patient registered successfully/i)).toBeVisible();
});
```

## API Mocking with Playwright

Use `page.route()` to intercept and mock API calls during testing:

```typescript
// Mock authentication response
await page.route("**/api/v1/auth/login/", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ token: "mock-token", user: { id: 1, username: "testuser" } }),
  });
});

// Mock patient data fetch
await page.route("**/api/v1/patient/**", async (route) => {
  if (route.request().method() === "GET") {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ id: 1, name: "Test Patient" }),
    });
  } else {
    await route.continue();
  }
});

// Mock file upload
await page.route("**/api/v1/files/", async (route) => {
  await route.fulfill({
    status: 201,
    body: JSON.stringify({ id: 123, file_url: "https://example.com/file.pdf" }),
  });
});
```

## Test Data Management (tests/fixtures/)

- `images/`: Test images for avatar and file upload testing (test-image.jpg, test-image-2.jpg)
- Test data generated dynamically using timestamps to avoid conflicts
- Test data should be PHI-safe and HIPAA-compliant (no real patient information)

## Setup and Support Files

- `tests/setup/auth.setup.ts`: Authenticates user and saves session to `tests/.auth/user.json`
- `tests/setup/facility.setup.ts`: Navigates to facility and extracts facility ID, saves to `tests/.auth/facilityMeta.json`
- `tests/support/facilityId.ts`: Utility to retrieve facility ID, auto-runs setup if meta file missing
- Authentication state stored in `tests/.auth/` (gitignored)

## Environment Configuration

- Local testing: `REACT_CARE_API_URL=http://127.0.0.1:9000`
- Base URL: `baseURL: "http://localhost:4000"` (configured in playwright.config.ts)
- Staging: Use staging backend URL from environment variables
- Timeouts: Default timeout adequate; increase for specific slow operations
- Viewport: Configure in playwright.config.ts using device descriptors

## Writing Playwright Tests

### Test Structure

```typescript
import { test, expect } from "@playwright/test";

test("should complete patient registration", async ({ page }) => {
  // Navigate to page
  await page.goto("/facility/patients");
  
  // Perform actions using semantic selectors
  await page.getByRole("button", { name: "Add Patient" }).click();
  await page.getByRole("textbox", { name: "Patient Name *" }).fill("John Doe");
  
  // Assert expected outcomes
  await expect(page.getByText("Patient registered successfully")).toBeVisible();
});
```

### Authentication in Tests

Most tests require authentication. Use stored auth state:

```typescript
import { test, expect } from "@playwright/test";

// Tests will use auth state from setup
test("authenticated action", async ({ page }) => {
  await page.goto("/dashboard");
  // User is already logged in
});
```

## Running Tests

```bash
# Install Playwright browsers
npm run playwright:install

# Run all tests (requires backend)
npm run playwright:test

# Run tests in UI mode (interactive debugging)
npm run playwright:test:ui

# Run tests in headed mode (see browser)
npm run playwright:test:headed

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# View HTML report
npm run playwright:show-report
```

## Best Practices

1. **Use semantic locators**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait properly**: Use `toBeVisible()`, `toBeEnabled()` instead of arbitrary timeouts
3. **Test user journeys**: Focus on complete workflows rather than isolated actions
4. **Handle async**: Use proper `await` with Playwright's auto-waiting
5. **Assert outcomes**: Always verify expected state changes after actions
6. **Accessibility**: Use semantic locators to inherently test accessibility
