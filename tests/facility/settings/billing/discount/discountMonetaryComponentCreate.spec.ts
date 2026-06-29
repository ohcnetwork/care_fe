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

  // Switch the factor/amount Select dropdown to the given option.
  // Uses data-slot="select-trigger" to distinguish the Radix Select from the
  // discount-code Autocomplete (which renders as data-slot="popover-trigger").
  async function selectValueType(page: Page, option: "Factor" | "Amount") {
    await page.locator('[data-slot="select-trigger"]').click();
    await page.getByRole("option", { name: option }).click();
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

    // Amount is the default — fill it so the title field gets blurred (touched).
    const amountInput = page.getByRole("spinbutton");
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

    // Amount is already selected by default — find the spinbutton directly.
    const amountInput = page.getByRole("spinbutton");
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

    // Switch to factor via the Select dropdown.
    await selectValueType(page, "Factor");

    const factorInput = page.getByRole("spinbutton");
    // Leave empty and trigger validation
    await factorInput.focus();
    await factorInput.blur();

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();

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

    // Amount is already selected by default — just fill it.
    const amountInput = page.getByRole("spinbutton");
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

    // Amount is already selected by default — fill the spinbutton directly.
    const amountInput = page.getByRole("spinbutton");
    await amountInput.fill("100");

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeEnabled();

    const [apiResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("set_monetary_config")),
      saveButton.click(),
    ]);
    expect(apiResponse.status()).toBe(200);

    await page.waitForLoadState("networkidle");

    // Verify component appears in table (confirms mutation succeeded)
    await expect(page.getByText(discountTitle)).toBeVisible();
  });

  test("should not allow submission with invalid factor value", async ({
    page,
  }) => {
    await openCreateForm(page);

    const titleInput = page.getByRole("textbox", { name: /name/i });
    await titleInput.fill("Invalid Factor Discount");

    // Switch to factor via the Select dropdown.
    await selectValueType(page, "Factor");

    const factorInput = page.getByRole("spinbutton");

    // Enter value > 100 (invalid)
    await factorInput.fill("150");
    await factorInput.blur();

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeDisabled();

    // react-hook-form (onSubmit mode) only populates errors after a submit event.
    // The save button is disabled, so we dispatch a synthetic submit to trigger
    // the zodResolver error population without native HTML constraint validation.
    await page
      .locator("form")
      .evaluate((form) =>
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
      );

    // Should show validation error ("Must be at most 100")
    const factorContainer = page.locator("div").filter({ has: factorInput });
    await expect(factorContainer.getByText(/at most/i).first()).toBeVisible();
  });
});
