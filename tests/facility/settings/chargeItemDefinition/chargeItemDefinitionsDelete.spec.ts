import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Charge Item Definition Delete operations", () => {
  let facilityId: string;
  let title: string;
  let slug: string;
  let basePrice: string;
  let categoryName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const chargeItemName = faker.commerce.productName();
    title = chargeItemName;
    slug = chargeItemName.replace(/\s+/g, "-").slice(0, 25);
    basePrice = faker.commerce.price({ dec: 0 });
    categoryName = "Medications";

    await page.goto(
      `/facility/${facilityId}/settings/charge_item_definitions/`,
    );
    await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
  });

  test("quick create and delete charge item definition", async ({ page }) => {
    await page.getByRole("button", { name: /add definition/i }).click();
    await page.getByRole("textbox", { name: /title/i }).fill(title);
    await page.getByRole("textbox", { name: /slug/i }).fill(slug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);

    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    await page.getByRole("textbox", { name: /search/i }).fill(title);
    await expect(page.getByRole("table").getByText(title)).toBeVisible();
    await page.getByRole("link", { name: "view" }).first().click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/charge item definition.*deleted successfully/i),
    ).toBeVisible();

    await page.getByRole("textbox", { name: /search/i }).fill(title);
    await expect(page.getByRole("table").getByText(title)).not.toBeVisible();
  });
});
