import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Monetary Component Settings", () => {
  let facilityId: string;

  async function navigateToDiscountComponents(page: Page) {
    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );
    await page.waitForLoadState("networkidle");
  }

  async function openCreateForm(page: Page) {
    const createButton = page.getByRole("button", {
      name: /create|add/i,
    });
    await expect(createButton).toBeVisible();
    await createButton.click();
    await page.waitForLoadState("networkidle");
  }

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await navigateToDiscountComponents(page);
  });

  test("save button should be disabled on empty form", async ({ page }) => {
    await openCreateForm(page);

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();
  });

  test("whitespace-only title should show 'This field is required' error", async ({
    page,
  }) => {
    await openCreateForm(page);

    const titleInput = page.getByRole("textbox", { name: /name/i });
    await titleInput.fill("   "); // Only whitespace

    const amountInput = page.getByLabel(/discount|amount/i).first();
    await amountInput.fill("100");

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();

    // Should show "This field is required" error for title
    await expect(
      page
        .locator("div")
        .filter({ has: titleInput })
        .getByText(/required/i),
    ).toBeVisible();

    // Error should NOT be the raw Zod type error
    await expect(page.getByText(/expected string/i)).not.toBeVisible();
  });

  test("empty discount amount should show friendly error, not 'Expected number, received null'", async ({
    page,
  }) => {
    await openCreateForm(page);

    const titleInput = page.getByRole("textbox", { name: /name/i });
    await titleInput.fill("Test Discount");

    const amountRadio = page.getByLabel(/amount/i).first();
    await amountRadio.click();

    const amountInput = page.getByRole("spinbutton", {
      name: /discount|amount/i,
    });
    // Leave empty and trigger validation
    await amountInput.focus();
    await amountInput.blur();

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();

    // Should show "This field is required"
    const amountContainer = page.locator("div").filter({ has: amountInput });
    await expect(amountContainer.getByText(/required/i)).toBeVisible();

    // Error should NOT be the raw Zod error
    await expect(page.getByText(/expected.*received null/i)).not.toBeVisible();
  });

  test("empty discount factor should show friendly error, not 'Expected number, received null'", async ({
    page,
  }) => {
    await openCreateForm(page);

    const titleInput = page.getByRole("textbox", { name: /name/i });
    await titleInput.fill("Test Discount Factor");

    // Select factor option
    const factorRadio = page.getByLabel(/factor/i).first();
    await factorRadio.click();

    const factorInput = page.getByRole("spinbutton", {
      name: /discount|factor|%/i,
    });
    // Leave empty and trigger validation
    await factorInput.focus();
    await factorInput.blur();

    const saveButton = page.getByRole("button", { name: /save/i });
    await saveButton.click();

    // Should show "This field is required"
    const factorContainer = page.locator("div").filter({ has: factorInput });
    await expect(factorContainer.getByText(/required/i)).toBeVisible();

    // Error should NOT be the raw Zod error
    await expect(page.getByText(/expected.*received null/i)).not.toBeVisible();
  });

  test("save button should be enabled only when form is valid", async ({
    page,
  }) => {
    await openCreateForm(page);

    const saveButton = page.getByRole("button", { name: /save/i });

    // Initially disabled
    await expect(saveButton).toBeDisabled();

    // Fill title
    const titleInput = page.getByRole("textbox", { name: /name/i });
    await titleInput.fill("Valid Discount");

    // Still disabled - no amount/factor
    await expect(saveButton).toBeDisabled();

    // Add amount
    const amountRadio = page.getByLabel(/amount/i).first();
    await amountRadio.click();

    const amountInput = page.getByRole("spinbutton", {
      name: /discount|amount/i,
    });
    await amountInput.fill("50");

    // Now should be enabled
    await expect(saveButton).toBeEnabled();
  });

  test("should create discount monetary component with valid data", async ({
    page,
  }) => {
    await openCreateForm(page);

    const titleInput = page.getByRole("textbox", { name: /name/i });
    const discountTitle = `Discount ${faker.string.alphanumeric(8)}`;
    await titleInput.fill(discountTitle);

    // Select and fill amount
    const amountRadio = page.getByLabel(/amount/i).first();
    await amountRadio.click();

    const amountInput = page.getByRole("spinbutton", {
      name: /discount|amount/i,
    });
    await amountInput.fill("100");

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await page.waitForLoadState("networkidle");

    // Verify success
    await expect(
      page.getByText(/discount.*component.*created|saved/i),
    ).toBeVisible();

    // Verify component appears in table
    await expect(page.getByText(discountTitle)).toBeVisible();
  });

  test("should not allow submission with invalid factor value", async ({
    page,
  }) => {
    await openCreateForm(page);

    const titleInput = page.getByRole("textbox", { name: /name/i });
    await titleInput.fill("Invalid Factor Discount");

    // Select factor option
    const factorRadio = page.getByLabel(/factor/i).first();
    await factorRadio.click();

    const factorInput = page.getByRole("spinbutton", {
      name: /discount|factor|%/i,
    });

    // Enter value > 100 (invalid)
    await factorInput.fill("150");
    await factorInput.blur();

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();

    // Should show validation error
    const factorContainer = page.locator("div").filter({ has: factorInput });
    await expect(
      factorContainer.getByText(/invalid|max|greater/i),
    ).toBeVisible();
  });
});
