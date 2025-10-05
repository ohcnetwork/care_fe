# Playwright Testing

This directory contains Playwright end-to-end tests for the CARE frontend application.

## Setup

### Install Playwright and Browsers

```bash
npm run playwright:install
```

This will install Playwright and all required browser binaries (Chromium, Firefox, and WebKit).

### Running Tests

Run all tests in headless mode:

```bash
npm run playwright:test
```

Run tests in UI mode (interactive):

```bash
npm run playwright:test:ui
```

Run tests in headed mode (visible browser):

```bash
npm run playwright:test:headed
```

Run specific test file:

```bash
npx playwright test e2e/login.spec.ts
```

Run tests in specific browser:

```bash
npx playwright test --project=chromium
```

### View Test Reports

After running tests, view the HTML report:

```bash
npm run playwright:show-report
```

## Directory Structure

```
playwright/
├── e2e/              # Test files
├── pageobjects/      # Page Object Models
├── fixtures/         # Test data and fixtures
└── tsconfig.json     # TypeScript configuration for tests
```

## Writing Tests

Tests follow the Page Object Model pattern. Example:

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pageobjects/LoginPage";

test.describe("Login Page", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display login form", async () => {
    await loginPage.verifyFormElements();
  });
});
```

## Prerequisites

To run tests against a local instance:

1. Start the backend server (see [CARE Backend Documentation](https://care-be-docs.ohc.network/))
2. Set the `REACT_CARE_API_URL` environment variable:
   ```bash
   # .env.local
   REACT_CARE_API_URL=http://127.0.0.1:9000
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. Run Playwright tests

## Configuration

Test configuration is defined in `playwright.config.ts` at the root of the project.

Key configuration options:

- **baseURL**: `http://localhost:4000` (default development server)
- **retries**: 1 retry on CI, 0 locally
- **workers**: 1 worker on CI, unlimited locally
- **timeout**: Default timeout for test actions
- **trace**: Enabled on first retry for debugging

## Debugging

### Debug specific test:

```bash
npx playwright test e2e/login.spec.ts --debug
```

### Playwright Inspector:

```bash
npx playwright test --debug
```

### View traces:

When a test fails on retry, a trace file is generated. You can view it with:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## CI/CD Integration

Playwright tests can be integrated into CI/CD pipelines. The configuration already includes:

- Retry logic for flaky tests
- Screenshot and video capture on failures
- Parallel execution support
- HTML report generation

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
