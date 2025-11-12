import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Knowledge Delete operations", () => {
  let facilityId: string;
  let name: string;
  let slug: string;
  let baseUnit: string;
  let categoryName: string;

  const baseUnitOptions = [
    "tablets",
    "milligram",
    "microgram",
    "milliliter",
    "drop",
    "international unit",
  ];

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const productName = faker.commerce.productName();

    name = productName;
    slug = productName.replace(/\s+/g, "-").slice(0, 25);
    baseUnit = faker.helpers.arrayElement(baseUnitOptions);
    categoryName = "Medications";

    await page.goto(`/facility/${facilityId}/settings/product_knowledge`);
    await page.getByRole("heading", { name: categoryName }).click();
  });

  test("quick create and delete product knowledge", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();
    await page.getByRole("textbox", { name: /name/i }).fill(name);
    await page.getByRole("textbox", { name: /slug/i }).fill(slug);
    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: baseUnit }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Remove Definition" }).click();
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible();

    await page.getByRole("textbox", { name: "Search products" }).fill(name);
    await expect(page.getByRole("table").getByText(name)).toBeVisible();
    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/product knowledge.*deleted successfully/i),
    ).toBeVisible();

    await page.getByRole("textbox", { name: "Search products" }).fill(name);
    await expect(page.getByRole("table").getByText(name)).not.toBeVisible();
  });
});
