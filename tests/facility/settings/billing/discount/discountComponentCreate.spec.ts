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
    await page.waitForLoadState("networkidle");

    // Enter edit mode
    const editButton = page.getByRole("button", { name: /edit/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    const maxApplicableInput = page.getByLabel(/maximum applicable discounts/i);
    await expect(maxApplicableInput).toBeVisible();
    await maxApplicableInput.fill("0"); // 0 = no limit

    const applicabilityOrderTrigger = page.getByLabel(/applicability order/i);
    await expect(applicabilityOrderTrigger).toBeVisible();
    await applicabilityOrderTrigger.click();

    const totalDescOption = page.getByRole("option", {
      name: /highest value first/i,
    });
    await expect(totalDescOption).toBeVisible();
    await totalDescOption.click();

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText(/discount configuration saved successfully/i),
    ).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await ensureDiscountConfiguration(page);

    componentName = faker.commerce.productName();
    discountValue = faker.number.int({ min: 1, max: 100 }).toString();
    conditionMin = faker.number.int({ min: 50, max: 80 }).toString();
    conditionMax = faker.number.int({ min: 81, max: 120 }).toString();

    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /create discount component/i }),
    ).toBeVisible();
  });

  test("validate required fields", async ({ page }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    const dialog = page.getByRole("dialog", {
      name: /create discount component/i,
    });
    await expect(dialog).toBeVisible();
    const discountValueInput = dialog.getByRole("spinbutton").first();
    await expect(discountValueInput).toBeVisible();
    await discountValueInput.fill(discountValue);

    await dialog.getByRole("button", { name: /save/i }).click();

    const nameField = dialog.getByRole("textbox", { name: /^name$/i });
    await expect(nameField).toHaveAttribute("aria-invalid", "true");

    const describedBy = await nameField.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const messageId = describedBy!.trim().split(/\s+/).pop()!;
    const nameFieldError = dialog.locator(`[id="${messageId}"]`);

    await expect(nameFieldError).toBeVisible();
    await expect(nameFieldError).toHaveText(/required/i);
  });

  test("create discount component and search", async ({ page }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("textbox", { name: /name/i }).fill(componentName);

    const discountValueInput = dialog.getByRole("spinbutton").first();
    await expect(discountValueInput).toBeVisible();
    await discountValueInput.fill(discountValue);

    await dialog.getByRole("button", { name: /save/i }).click();

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
  });

  test("create discount component with condition", async ({ page }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("textbox", { name: /name/i })
      .fill(`${componentName} with condition`);

    const discountValueInput = dialog.getByRole("spinbutton").first();
    await expect(discountValueInput).toBeVisible();
    await discountValueInput.fill(discountValue);

    await dialog.getByRole("button", { name: /add condition/i }).click();

    await dialog
      .getByRole("combobox")
      .filter({ hasText: /^Metric|Encounter/ })
      .click();
    await page.getByRole("option", { name: "Patient Age" }).click();

    await dialog.getByRole("combobox").filter({ hasText: "In range" }).click();
    await page.getByRole("option", { name: "In range" }).click();

    await dialog.getByPlaceholder("Min").fill(conditionMin);
    await dialog.getByPlaceholder("Max").fill(conditionMax);
    await dialog.getByRole("button", { name: /^add$/i }).click();

    await dialog.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(/discount component created/i)).toBeVisible();

    await expect(
      page.getByRole("table").getByText(`${componentName} with condition`),
    ).toBeVisible();
  });
});
