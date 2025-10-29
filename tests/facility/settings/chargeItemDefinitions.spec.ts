import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe(() => {
  let facilityId: string;
  let testData: {
    title: string;
    slug: string;
    basePrice: string;
    mrp: string;
    purchasePrice: string;
    description: string;
    purpose: string;
    url: string;
  };

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const chargeItemName = faker.commerce.productName();
    testData = {
      title: chargeItemName,
      slug: chargeItemName.replace(/\s+/g, "-").slice(0, 25),
      basePrice: faker.commerce.price(),
      mrp: faker.commerce.price(),
      purchasePrice: faker.commerce.price(),
      description: faker.commerce.productDescription(),
      purpose: faker.commerce.productAdjective(),
      url: faker.internet.url(),
    };

    await page.goto(
      `/facility/${facilityId}/settings/charge_item_definitions/categories/f-${facilityId}-medications-charge_item_definition`,
    );
  });

  test("validate required fields", async ({ page }) => {
    await page.getByRole("button", { name: /add definition/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Title required
    await expect(page.getByText(/title.*required/i)).toBeVisible();
    // Slug required/length
    await expect(page.getByText(/slug.*atleast 5.*atmost 25/i)).toBeVisible();
    // Base Price required/invalid
    await expect(page.getByText(/base price.*greater than 0/i)).toBeVisible();
  });

  test("create charge item definition", async ({ page }) => {
    await page.getByRole("button", { name: /add definition/i }).click();
    await page.getByRole("textbox", { name: /title/i }).fill(testData.title);
    await page.getByRole("textbox", { name: /slug/i }).fill(testData.slug);
    await page
      .getByRole("textbox", { name: /description/i })
      .fill(testData.description);
    await page
      .getByRole("textbox", { name: /purpose/i })
      .fill(testData.purpose);
    await page.getByRole("textbox", { name: /uri/i }).fill(testData.url);
    await page
      .getByRole("textbox", { name: /base price/i })
      .fill(testData.basePrice);
    await page.getByRole("textbox", { name: /mrp/i }).fill(testData.mrp);
    await page
      .getByRole("textbox", { name: /purchase price/i })
      .fill(testData.purchasePrice);
    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();
  });

  test("edit charge item definition", async ({ page }) => {
    await page.getByRole("link", { name: "Edit" }).first().click();
    await page
      .getByRole("textbox", { name: /title/i })
      .fill(testData.title + " - edited");
    await page
      .getByRole("textbox", { name: /description/i })
      .fill(testData.description + " - edited");
    await page
      .getByRole("textbox", { name: /purpose/i })
      .fill(testData.purpose + " - edited");
    await page.getByRole("textbox", { name: /uri/i }).fill(testData.url);
    await page
      .getByRole("textbox", { name: /base price/i })
      .fill(testData.basePrice);
    await page.getByRole("textbox", { name: /mrp/i }).fill(testData.mrp);
    await page
      .getByRole("textbox", { name: /purchase price/i })
      .fill(testData.purchasePrice);
    await page.getByRole("button", { name: /update/i }).click();

    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test("delete charge item definition", async ({ page }) => {
    await page.getByRole("link", { name: "view" }).first().click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/charge item definition.*deleted successfully/i),
    ).toBeVisible();
  });
});
