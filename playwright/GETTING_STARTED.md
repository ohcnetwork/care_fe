# Getting Started with Playwright

This guide will help you set up and run Playwright tests for the CARE frontend.

## Prerequisites

Before running Playwright tests, ensure you have:

1. **Node.js 22+** installed
2. **Backend server running** (see [CARE Backend Setup](https://care-be-docs.ohc.network/))
3. **Frontend dependencies installed**

## Installation

### 1. Install Project Dependencies

```bash
npm install --ignore-scripts
npm run postinstall
npm run setup
```

### 2. Install Playwright Browsers

```bash
npm run playwright:install
```

This command installs Chromium, Firefox, and WebKit browsers along with their dependencies.

## Configuration

### Environment Variables

Create a `.env.local` file in the project root with:

```env
REACT_CARE_API_URL=http://127.0.0.1:9000
```

This points the frontend to your local backend server.

## Running Tests

### All Tests (Headless)

Run all tests in headless mode (no browser UI):

```bash
npm run playwright:test
```

### Interactive UI Mode

Run tests in Playwright's interactive UI mode:

```bash
npm run playwright:test:ui
```

This mode allows you to:

- See test execution in real-time
- Debug tests interactively
- Time-travel through test steps
- Inspect DOM and network requests

### Headed Mode

Run tests with visible browser windows:

```bash
npm run playwright:test:headed
```

### Specific Tests

Run a specific test file:

```bash
npx playwright test e2e/login.spec.ts
```

Run tests matching a pattern:

```bash
npx playwright test login
```

### Specific Browser

Run tests in a specific browser:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Debugging Tests

### Debug Mode

Run tests in debug mode with Playwright Inspector:

```bash
npx playwright test --debug
```

### Debug Specific Test

```bash
npx playwright test e2e/login.spec.ts --debug
```

### VS Code Debugging

Install the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension for integrated debugging.

## Viewing Test Results

### HTML Report

After running tests, view the HTML report:

```bash
npm run playwright:show-report
```

The report includes:

- Test results and statistics
- Screenshots of failures
- Videos of test runs
- Traces for debugging

### Test Artifacts

Test artifacts are stored in:

- `test-results/` - Screenshots, videos, and traces
- `playwright-report/` - HTML report files

## Writing Tests

### Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pageobjects/LoginPage";

test.describe("Feature Name", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should perform action", async () => {
    await loginPage.verifyFormElements();
  });
});
```

### Page Object Pattern

Create reusable page objects in `playwright/pageobjects/`:

```typescript
import { type Page, type Locator } from "@playwright/test";

export class MyPage {
  readonly page: Page;
  readonly myButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.myButton = page.locator('[data-cy="my-button"]');
  }

  async clickMyButton() {
    await this.myButton.click();
  }
}
```

### Using Fixtures

Load test data from `playwright/fixtures/`:

```typescript
import { test } from "@playwright/test";
import users from "../fixtures/users.json";

test("login as admin", async ({ page }) => {
  const admin = users.users.administrator;
  // Use admin.username and admin.password
});
```

## Best Practices

1. **Use data-cy attributes** for stable selectors
2. **Follow Page Object Model** pattern for reusability
3. **Wait for elements** before interacting
4. **Use meaningful test descriptions**
5. **Keep tests independent** - don't rely on test order
6. **Clean up after tests** - use afterEach hooks
7. **Use fixtures** for test data
8. **Avoid hardcoded waits** - use Playwright's auto-waiting

## Common Commands

| Command                          | Description                    |
| -------------------------------- | ------------------------------ |
| `npm run playwright:test`        | Run all tests headlessly       |
| `npm run playwright:test:ui`     | Run tests in UI mode           |
| `npm run playwright:test:headed` | Run tests with visible browser |
| `npm run playwright:show-report` | View HTML report               |
| `npm run playwright:install`     | Install browsers               |
| `npx playwright test --debug`    | Debug tests                    |
| `npx playwright codegen`         | Generate test code             |

## Troubleshooting

### Browsers Not Installed

If you see an error about browsers not being installed:

```bash
npm run playwright:install
```

### Tests Timeout

If tests timeout, ensure:

1. Backend server is running
2. Frontend dev server is running (`npm run dev`)
3. Network connectivity is working

### Port Conflicts

If port 4000 is in use, either:

1. Stop the process using port 4000
2. Update `baseURL` in `playwright.config.ts`

## CI/CD Integration

The project includes a GitHub Actions workflow (`.github/workflows/playwright.yaml`) that:

- Runs on pull requests to `develop` and `production` branches
- Installs dependencies and browsers
- Builds the application
- Runs all Playwright tests
- Uploads test reports and results as artifacts

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [CARE Documentation](https://docs.ohc.network/docs/care)
