# Playwright vs Cypress in CARE

This document explains why both Playwright and Cypress are available in the CARE project and when to use each.

## Overview

CARE now supports both **Cypress** and **Playwright** for end-to-end testing:

- **Cypress**: Existing testing framework with extensive test coverage
- **Playwright**: Newly added testing framework with modern features

## When to Use Each

### Use Cypress When:

- ✅ Working with existing tests (most tests are in Cypress)
- ✅ Need to debug interactively with time-travel debugging
- ✅ Prefer the Cypress UI for test development
- ✅ Working on features already covered by Cypress tests

### Use Playwright When:

- ✅ Writing new tests for new features
- ✅ Need cross-browser testing (Chromium, Firefox, WebKit)
- ✅ Want faster test execution
- ✅ Need better CI/CD integration
- ✅ Prefer TypeScript-first testing
- ✅ Want built-in auto-waiting and retry mechanisms

## Feature Comparison

| Feature            | Cypress               | Playwright                             |
| ------------------ | --------------------- | -------------------------------------- |
| Browser Support    | Chrome, Edge, Firefox | Chrome, Edge, Firefox, Safari (WebKit) |
| Speed              | Moderate              | Fast                                   |
| Auto-waiting       | Yes                   | Yes (more robust)                      |
| Parallel Execution | Limited               | Built-in                               |
| Mobile Testing     | Viewport only         | Viewport + device emulation            |
| Screenshots        | Yes                   | Yes                                    |
| Video Recording    | Yes                   | Yes                                    |
| Trace Viewer       | Limited               | Excellent                              |
| TypeScript Support | Good                  | Excellent                              |
| Learning Curve     | Easy                  | Moderate                               |
| Community Size     | Large                 | Growing                                |
| CI/CD Integration  | Good                  | Excellent                              |

## Test Structure Comparison

### Cypress Test

```typescript
import { LoginPage } from "@/pageObject/auth/LoginPage";

describe("Login Page", () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display login form", () => {
    loginPage.verifyFormElements();
  });
});
```

### Playwright Test

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

## Migration Path

### Current State

- All existing tests remain in Cypress
- New Playwright setup is available for use

### Recommended Approach

1. **Keep Cypress tests** - Don't migrate existing tests
2. **Use Playwright for new features** - Write new tests in Playwright
3. **Gradual adoption** - Team can learn Playwright over time
4. **Parallel execution** - Both can run in CI/CD

### Migration Considerations

If you decide to migrate a test from Cypress to Playwright:

1. Convert `cy.get()` to `page.locator()`
2. Add `async/await` to all actions
3. Update page object imports
4. Use Playwright's expect syntax
5. Update CI/CD workflow if needed

## Running Both

You can run both test suites:

```bash
# Run Cypress tests
npm run cypress:run

# Run Playwright tests
npm run playwright:test
```

## CI/CD Integration

Both frameworks have separate GitHub Actions workflows:

- `.github/workflows/cypress.yaml` - Runs Cypress tests
- `.github/workflows/playwright.yaml` - Runs Playwright tests

Both run on pull requests to `develop` and `production` branches.

## Best Practices

1. **Don't duplicate tests** - Choose one framework per feature
2. **Use consistent patterns** - Follow existing test patterns in each framework
3. **Share page objects** - When possible, keep selectors consistent
4. **Document your choice** - Note in PR why you chose Cypress or Playwright
5. **Maintain both** - Keep both frameworks up to date

## Getting Help

### Cypress Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [CARE Testing Documentation](https://docs.coronasafe.network/care-testing-documentation/)
- Existing tests in `cypress/` directory

### Playwright Resources

- [Playwright Documentation](https://playwright.dev/)
- [Getting Started Guide](./GETTING_STARTED.md)
- Example tests in `playwright/e2e/` directory

## Future Plans

The CARE project will:

1. Maintain both frameworks for the foreseeable future
2. Gradually increase Playwright adoption for new features
3. Evaluate long-term strategy based on team feedback
4. Keep Cypress tests for features with good coverage

## Questions?

If you're unsure which framework to use for a new test:

1. Check if similar tests exist in Cypress - use Cypress
2. For new features without existing tests - prefer Playwright
3. Ask in PR reviews for guidance
4. Consult the CARE testing documentation
