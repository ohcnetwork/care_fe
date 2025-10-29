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
    "count",
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
    };

    await page.goto(
      `/facility/${facilityId}/settings/product_knowledge/categories/f-${facilityId}-medications-product_knowledge`,
    );
  });

  test("validate", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/required|not valid|invalid/i).first(),
    ).toBeVisible();
  });

  test("create", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();

    // Basic details
    await page.getByRole("textbox", { name: /name/i }).fill(testData.name);
    await page.getByRole("textbox", { name: /slug/i }).fill(testData.slug);
    await page.getByRole("combobox", { name: /product type/i }).click();
    await page.getByRole("option", { name: testData.productType }).click();
    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: testData.baseUnit }).click();
    await page
      .getByRole("textbox", { name: "HSN Code" })
      .fill(testData.hsnCode);

    // Alternate names and storage guidelines
    await page.getByRole("button", { name: "Add Name" }).click();
    await page.locator('input[name="names.0.name"]').fill(testData.altNames);

    await page.getByRole("button", { name: "Add Guideline" }).click();
    await page
      .getByRole("textbox", { name: "Note" })
      .fill(testData.storageGuidelines);
    await page.getByRole("spinbutton", { name: "Duration Value" }).fill("2");

    // Dosage form
    await page.getByRole("combobox", { name: /dosage form/i }).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible();
  });

  test("view and edit", async ({ page }) => {
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
  });

  test("delete", async ({ page }) => {
    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/product knowledge.*deleted successfully/i),
    ).toBeVisible();
  });
});
