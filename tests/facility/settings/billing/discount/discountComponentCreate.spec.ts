import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Component Settings", () => {
  let facilityId: string;
  let componentName: string;
  let discountValue: string;
  let conditionMin: string;
  let conditionMax: string;

  async function ensureDiscountConfiguration(page: Page) {
    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_configuration`,
    );

    // Enter edit mode
    const editButton = page.getByRole("button", { name: /edit/i });
    await expect(editButton).toBeVisible({ timeout: 15000 });
    await editButton.click();

    const maxApplicableInput = page.getByLabel(/maximum applicable discounts/i);
    await expect(maxApplicableInput).toBeVisible({ timeout: 15000 });
    await maxApplicableInput.fill("0"); // 0 = no limit

    const applicabilityOrderTrigger = page.getByLabel(/applicability order/i);
    await expect(applicabilityOrderTrigger).toBeVisible({ timeout: 15000 });
    await applicabilityOrderTrigger.click();

    const totalDescOption = page.getByRole("option", {
      name: /highest value first/i,
    });
    await expect(totalDescOption).toBeVisible({ timeout: 15000 });
    await totalDescOption.click();

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await saveButton.click();

    await expect(
      page.getByText(/discount configuration saved successfully/i),
    ).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    componentName = faker.commerce.productName();
    discountValue = faker.number.int({ min: 1, max: 100 }).toString();
    conditionMin = faker.number.int({ min: 50, max: 80 }).toString();
    conditionMax = faker.number.int({ min: 81, max: 120 }).toString();

    // Ensure the facility has a valid discount configuration before creating codes
    await ensureDiscountConfiguration(page);

    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );

    await expect(
      page.getByRole("button", { name: /create discount component/i }),
    ).toBeVisible();
  });

  test("validate required fields", async ({ page }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    const discountValueInput = dialog.getByRole("spinbutton").first();
    await expect(discountValueInput).toBeVisible({ timeout: 15000 });
    await discountValueInput.fill(discountValue);

    const saveButton = page.getByRole("button", { name: /save/i });
    await saveButton.click();

    await expect(page.getByText(/this field is required/i)).toBeVisible();
  });

  test("create discount component and search", async ({ page }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.getByRole("textbox", { name: /name/i }).fill(componentName);

    const discountValueInput = dialog.getByRole("spinbutton").first();
    await expect(discountValueInput).toBeVisible({ timeout: 15000 });
    await discountValueInput.fill(discountValue);

    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(/discount component created/i)).toBeVisible();

    const table = page.getByRole("table");
    await expect(table.getByText(componentName)).toBeVisible();

    const searchInput = page.getByPlaceholder(/search/i);

    await searchInput.fill(componentName);
    await expect(table.getByText(componentName)).toBeVisible();

    const nonMatchingQuery = faker.string.alphanumeric(10);
    await searchInput.fill(nonMatchingQuery);

    await expect(
      page.getByText(/no discount components matches this search/i),
    ).toBeVisible();
    await expect(table.getByText(componentName)).toHaveCount(0);
  });

  test("create discount component with condition", async ({ page }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog
      .getByRole("textbox", { name: /name/i })
      .fill(`${componentName} with condition`);

    const discountValueInput = dialog.getByRole("spinbutton").first();
    await expect(discountValueInput).toBeVisible({ timeout: 15000 });
    await discountValueInput.fill(discountValue);

    await page.getByRole("button", { name: /add condition/i }).click();

    await page
      .getByRole("combobox")
      .filter({ hasText: /^Metric|Encounter/ })
      .click();
    await page.getByRole("option", { name: "Patient Age" }).click();

    await page.getByRole("combobox").filter({ hasText: "In range" }).click();
    await page.getByRole("option", { name: "In range" }).click();

    await page.getByPlaceholder("Min").fill(conditionMin);
    await page.getByPlaceholder("Max").fill(conditionMax);
    await page.getByRole("button", { name: /^add$/i }).click();

    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(/discount component created/i)).toBeVisible();

    await expect(
      page.getByRole("table").getByText(`${componentName} with condition`),
    ).toBeVisible();
  });
});
