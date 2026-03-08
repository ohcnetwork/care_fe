import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Components Management", () => {
  let facilityId: string;
  let componentName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    componentName = `Discount-${faker.string.alphanumeric(5)}`;

    await page.goto(`/facility/${facilityId}/settings/billing/discount_codes`);
    await page.getByRole("button", { name: /create discount code/i }).click();
    const code = `CODE-${faker.string.alphanumeric(5)}`;
    await page.getByLabel(/name/i).fill(`Test Code ${code}`);
    await page.getByRole("textbox", { name: "Code" }).fill(code);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/discount code created/i)).toBeVisible();

    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );
  });

  test("validate required fields specifically discount code", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(/field is required/i).first()).toBeVisible();
  });

  test("create a discount component successfully", async ({ page }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    await page.getByLabel(/name/i).fill(componentName);

    await page.locator('input[type="number"]').fill("100");

    await page.getByRole("combobox").nth(1).click();
    const codeCombobox = page.getByPlaceholder(/search option/i);
    await codeCombobox.fill("Test Code");
    await page.getByRole("option").first().click();

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(/discount component created/i)).toBeVisible();
    await expect(page.getByText(componentName)).toBeVisible();
  });
});
