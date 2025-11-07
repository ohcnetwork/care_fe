import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe(() => {
  let facilityId: string;
  let testData: {
    name: string;
    slug: string;
    productType: string;
    baseUnit: string;
    hsnCode: string;
    altNames: string;
    storageGuidelines: string;
    categoryName: string;
  };

  const productTypeOptions = [
    "Medication",
    "Nutritional Product",
    "Consumable",
  ];

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
    testData = {
      name: productName,
      slug: productName.replace(/\s+/g, "-").slice(0, 25),
      productType: faker.helpers.arrayElement(productTypeOptions),
      baseUnit: faker.helpers.arrayElement(baseUnitOptions),
      hsnCode: faker.phone.number(),
      altNames: productName + "Alt",
      storageGuidelines: faker.commerce.productDescription(),
      categoryName: "Medications",
    };

    await page.goto(`/facility/${facilityId}/settings/product_knowledge`);
    await page.getByRole("heading", { name: testData.categoryName }).click();
  });

  test("view and edit and confirm", async ({ page }) => {
    await page.getByRole("link", { name: "View" }).first().click();
    await page.getByRole("button", { name: "Edit" }).click();

    await page
      .getByRole("textbox", { name: /name/i })
      .first()
      .fill(testData.name);
    await page.getByRole("combobox", { name: /product type/i }).click();
    await page.getByRole("option", { name: testData.productType }).click();

    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: testData.baseUnit }).click();
    await page
      .getByRole("textbox", { name: "HSN Code" })
      .fill(testData.hsnCode);
    await page.getByRole("button", { name: /update/i }).click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    await expect(
      page.getByRole("heading").getByText(testData.name),
    ).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();

    await page
      .getByRole("textbox", { name: "Search products" })
      .fill(testData.name);
    await expect(
      page.getByRole("table").getByText(testData.name),
    ).toBeVisible();
  });

  test("quick create and delete product knowledge", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();
    await page.getByRole("textbox", { name: /name/i }).fill(testData.name);
    await page.getByRole("textbox", { name: /slug/i }).fill(testData.slug);
    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: testData.baseUnit }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Remove Definition" }).click();
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible();

    await page
      .getByRole("textbox", { name: "Search products" })
      .fill(testData.name);
    await expect(
      page.getByRole("table").getByText(testData.name),
    ).toBeVisible();
    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/product knowledge.*deleted successfully/i),
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Search products" })
      .fill(testData.name);
    await expect(
      page.getByRole("table").getByText(testData.name),
    ).not.toBeVisible();
  });
});
