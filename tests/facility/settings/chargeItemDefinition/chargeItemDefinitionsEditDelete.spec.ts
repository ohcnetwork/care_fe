import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Charge Item Definition Edit/Delete operations", () => {
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
    categoryName: string;
  };

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const chargeItemName = faker.commerce.productName();
    testData = {
      title: chargeItemName,
      slug: chargeItemName.replace(/\s+/g, "-").slice(0, 25),
      basePrice: faker.commerce.price({ dec: 0 }),
      mrp: faker.commerce.price({ dec: 0 }),
      purchasePrice: faker.commerce.price({ dec: 0 }),
      description: faker.commerce.productDescription(),
      purpose: faker.commerce.productAdjective(),
      url: faker.internet.url(),
      categoryName: "Medications",
    };

    await page.goto(
      `/facility/${facilityId}/settings/charge_item_definitions/`,
    );
    await page
      .getByRole("textbox", { name: "Search categories..." })
      .fill(testData.categoryName);
    await page.getByRole("heading", { name: testData.categoryName }).click();
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

    await expect(
      page.getByRole("heading").getByText(testData.title + " - edited"),
    ).toBeVisible();

    await expect(
      page.getByText(testData.description + " - edited"),
    ).toBeVisible();
    await expect(page.getByText(testData.purpose + " - edited")).toBeVisible();
    await expect(page.getByText(testData.url)).toBeVisible();
    await expect(page.getByText(testData.basePrice)).toBeVisible();
    await expect(page.getByText(testData.mrp)).toBeVisible();
    await expect(page.getByText(testData.purchasePrice)).toBeVisible();

    await page.getByRole("button", { name: "Back" }).click();

    await page
      .getByRole("textbox", { name: /search/i })
      .fill(testData.title + " - edited");
    await expect(
      page.getByRole("table").getByText(testData.title + " - edited"),
    ).toBeVisible();
  });

  test("quick create and delete charge item definition", async ({ page }) => {
    await page.getByRole("button", { name: /add definition/i }).click();
    await page.getByRole("textbox", { name: /title/i }).fill(testData.title);
    await page.getByRole("textbox", { name: /slug/i }).fill(testData.slug);
    await page
      .getByRole("textbox", { name: /base price/i })
      .fill(testData.basePrice);

    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    await page.getByRole("textbox", { name: /search/i }).fill(testData.title);
    await expect(
      page.getByRole("table").getByText(testData.title),
    ).toBeVisible();
    await page.getByRole("link", { name: "view" }).first().click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/charge item definition.*deleted successfully/i),
    ).toBeVisible();

    await page.getByRole("textbox", { name: /search/i }).fill(testData.title);
    await expect(
      page.getByRole("table").getByText(testData.title),
    ).not.toBeVisible();
  });
});
