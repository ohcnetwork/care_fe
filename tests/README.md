# Playwright Testing for CARE

This directory contains end-to-end tests for the CARE frontend using [Playwright](https://playwright.dev/).

## Quick Start

### Installation

Install Playwright browsers:

```bash
npm run playwright:install
```

### Running Tests

```bash
# Run all tests
npm run playwright:test

# Run tests in UI mode (interactive)
npm run playwright:test:ui

# Run tests in headed mode (see the browser)
npm run playwright:test:headed

# Run specific test file
npx playwright test tests/login.spec.ts

# Run tests in a specific browser
npx playwright test --project=chromium

# View HTML report
npm run playwright:show-report
```

## Prerequisites

Before running tests, ensure:

1. **Backend is running** - See [CARE Backend Setup](https://care-be-docs.ohc.network/)
2. **Frontend dev server is running**: `npm run dev`
3. **Environment variables** - Create `.env.local` with:
   ```env
   REACT_CARE_API_URL=http://127.0.0.1:9000
   ```

## Test Structure

```
tests/
├── auth.setup.ts           # Authentication setup
├── login.spec.ts          # Login functionality tests
├── homepage.spec.ts       # Homepage tests
├── authenticated.spec.ts  # Tests requiring authentication
└── .auth/                 # Stored authentication state (gitignored)
```

## Writing Tests

### Basic Test

```typescript
import { test, expect } from "@playwright/test";

test("should display page title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CARE/);
});
```

### Using Locators

Playwright recommends using role-based selectors:

```typescript
// ✅ Good - Use role-based selectors
await page.getByRole("button", { name: /login/i }).click();
await page.getByRole("textbox", { name: /username/i }).fill("user");
await page.getByLabel(/password/i).fill("pass");

// ✅ Good - Use text selectors
await page.getByText("Submit").click();

// ⚠️ Avoid - Don't use CSS selectors unless necessary
await page.locator(".submit-button").click();
```

### Testing with Authentication

Tests in `authenticated.spec.ts` use a stored authentication state:

```typescript
import { test, expect } from "@playwright/test";

// Use stored auth state
test.use({ storageState: "tests/.auth/user.json" });

test("authenticated test", async ({ page }) => {
  // Test runs with user already logged in
  await page.goto("/dashboard");
  // ...
});
```

## Best Practices

1. **Use Auto-waiting**: Playwright automatically waits for elements
2. **Use Web-First Assertions**: `expect(locator).toBeVisible()` instead of manual waits
3. **Use Role Selectors**: More resilient than CSS selectors
4. **Avoid Hard-coded Waits**: Use `waitForLoadState()` or element visibility
5. **Test User Flows**: Test complete user journeys, not just individual functions

## Debugging

### Debug Mode

```bash
# Debug all tests
npx playwright test --debug

# Debug specific test
npx playwright test tests/login.spec.ts --debug
```

### VS Code Integration

Install the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension for:

- Running tests from the editor
- Setting breakpoints
- Viewing test results inline

### Trace Viewer

View traces for failed tests:

```bash
npx playwright show-trace trace.zip
```

## Configuration

See `playwright.config.ts` for configuration options:

- **baseURL**: http://localhost:4000
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 on CI, 0 locally
- **Trace**: Captured on first retry

## CI/CD

Tests run automatically on GitHub Actions. See `.github/workflows/playwright.yaml`.

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
