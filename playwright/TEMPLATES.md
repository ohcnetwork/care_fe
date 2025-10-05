# Playwright Test Templates

This directory contains templates for creating new Playwright tests quickly.

## Basic Test Template

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/your-route");
  });

  test("should do something", async ({ page }) => {
    // Your test code here
  });
});
```

## Test with Page Object Template

```typescript
import { test, expect } from "@playwright/test";
import { YourPage } from "../pageobjects/YourPage";

test.describe("Feature Name", () => {
  let yourPage: YourPage;

  test.beforeEach(async ({ page }) => {
    yourPage = new YourPage(page);
    await yourPage.goto();
  });

  test("should do something", async () => {
    await yourPage.performAction();
    await expect(yourPage.someElement).toBeVisible();
  });
});
```

## Page Object Template

```typescript
import { type Page, type Locator } from "@playwright/test";

export class YourPage {
  readonly page: Page;
  readonly element1: Locator;
  readonly element2: Locator;

  constructor(page: Page) {
    this.page = page;
    this.element1 = page.locator('[data-cy="element-1"]');
    this.element2 = page.locator('[data-cy="element-2"]');
  }

  async goto() {
    await this.page.goto("/your-route");
  }

  async performAction() {
    await this.element1.click();
  }

  async verifyState() {
    await this.element2.waitFor({ state: "visible" });
  }
}
```

## Creating New Tests

### 1. Create a new test file

```bash
# In playwright/e2e/
touch my-feature.spec.ts
```

### 2. Create a page object (if needed)

```bash
# In playwright/pageobjects/
touch MyFeaturePage.ts
```

### 3. Use the templates above to scaffold your test

### 4. Run your test

```bash
npx playwright test e2e/my-feature.spec.ts
```

## Tips

- Always use `data-cy` attributes for selectors when available
- Keep page objects focused on a single page or component
- Use meaningful test descriptions
- Add comments for complex test logic
- Use fixtures for test data
- Follow the existing test patterns in the codebase
