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
    await page.waitForLoadState("networkidle");

    // Enter edit mode
    const editButton = page.getByRole("button", { name: /edit/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Set a simple, valid configuration using the real labels
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
    discountName = faker.commerce.productName();
    discountCode = discountName.replace(/\s+/g, "-").slice(0, 20).toLowerCase();
    await page.goto(`/facility/${facilityId}/settings/billing/discount_codes`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /create discount code/i }),
    ).toBeVisible();
  });

  test("validate required Code field", async ({ page }) => {
    await page.getByRole("button", { name: /create discount code/i }).click();

    await page.getByRole("textbox", { name: /name/i }).fill(discountName);

    await page.getByRole("button", { name: /save/i }).click();

    const codeField = page.getByRole("textbox", { name: /code/i });
    const codeFieldContainer = page.locator("div").filter({ has: codeField });

    await expect(codeFieldContainer.getByText(/^code$/i)).toBeVisible();
    await expect(codeField).toHaveAttribute("aria-invalid", "true");
    await expect(codeFieldContainer.getByText(/required/i)).toBeVisible();
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

    const searchInput = page.getByPlaceholder(/search/i);

    await searchInput.fill(discountName);
    await expect(page.getByRole("table").getByText(discountName)).toBeVisible();

    const nonMatchingQuery = faker.string.alphanumeric(12);
    await searchInput.fill(nonMatchingQuery);

    await expect(
      page.getByText(/no discount codes matches this search/i),
    ).toBeVisible();
  });
});
