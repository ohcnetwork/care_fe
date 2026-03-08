import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Components Management", () => {
  let facilityId: string;
  let componentName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    componentName = `Discount-${faker.string.alphanumeric(5)}`;

    await page.goto(`/facility/${facilityId}/settings/billing/discount_codes`);
    page.on("response", async (response) => {
      if (response.url().includes("set_monetary_codes")) {
        console.log("API Status:", response.status());
        const body = await response.text();
        console.log("API Response:", body);
      }
    });

    await page.getByRole("button", { name: /create discount code/i }).click();
    const code = `CODE-${faker.string.alphanumeric(5)}`;
    await page.getByLabel(/name/i).fill(`Test Code ${code}`);
    await page.getByRole("textbox", { name: "Code" }).fill(code);
    await page.getByRole("button", { name: "Save" }).click();
    await expectToast(page, /discount[_ ]code[_ ]created/i);

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

    await expectToast(page, /discount[_ ]component[_ ]created/i);
    await expect(page.getByText(componentName)).toBeVisible();
  });
});
