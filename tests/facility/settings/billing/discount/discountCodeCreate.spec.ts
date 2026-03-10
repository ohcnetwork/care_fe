import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Code Settings", () => {
  let facilityId: string;
  let discountName: string;
  let discountCode: string;

  async function ensureDiscountConfiguration(page: Page) {
    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_configuration`,
    );

    // Enter edit mode
    const editButton = page.getByRole("button", { name: /edit/i });
    await expect(editButton).toBeVisible({ timeout: 15000 });
    await editButton.click();

    // Set a simple, valid configuration using the real labels
    const maxApplicableInput = page.getByLabel(/maximum applicable discounts/i);
    await expect(maxApplicableInput).toBeVisible({ timeout: 15000 });
    await maxApplicableInput.fill("0"); // 0 = no limit

    const applicabilityOrderTrigger = page.getByLabel(/applicability order/i);
    await expect(applicabilityOrderTrigger).toBeVisible({ timeout: 15000 });
    await applicabilityOrderTrigger.click();

    const totalDescOption = page.getByRole("option", {
      name: /highest value first/i,
    });
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
    discountName = faker.commerce.productName();
    discountCode = discountName.replace(/\s+/g, "-").slice(0, 20).toLowerCase();

    // Ensure the facility has a valid discount configuration before creating codes
    await ensureDiscountConfiguration(page);

    await page.goto(`/facility/${facilityId}/settings/billing/discount_codes`);

    await expect(
      page.getByRole("button", { name: /create discount code/i }),
    ).toBeVisible();
  });

  test("validate required Code field", async ({ page }) => {
    await page.getByRole("button", { name: /create discount code/i }).click();

    await page.getByRole("textbox", { name: /name/i }).fill(discountName);

    await page.getByRole("button", { name: /save/i }).click();

    await expect(
      page.getByText(/this field is required/i).last(),
    ).toBeVisible();
  });

  test("create discount code and search", async ({ page }) => {
    await page.getByRole("button", { name: /create discount code/i }).click();

    await page.getByRole("textbox", { name: /name/i }).fill(discountName);
    await page.getByRole("textbox", { name: /code/i }).fill(discountCode);

    await page.getByRole("button", { name: /save/i }).click();

    await expect(
      page.getByText(/discount code created successfully/i),
    ).toBeVisible();

    await expect(page.getByRole("table").getByText(discountName)).toBeVisible();
    await expect(page.getByRole("table").getByText(discountCode)).toBeVisible();

    const searchInput = page.getByRole("textbox", { name: /search/i });

    await searchInput.fill(discountName);
    await expect(page.getByRole("table").getByText(discountName)).toBeVisible();

    const nonMatchingQuery = faker.string.alphanumeric(12);
    await searchInput.fill(nonMatchingQuery);

    await expect(
      page.getByText(/no discount codes matches this search/i),
    ).toBeVisible();
    await expect(page.getByRole("table").getByText(discountName)).toHaveCount(
      0,
    );
  });
});
