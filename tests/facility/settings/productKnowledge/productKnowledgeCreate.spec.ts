import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Knowledge Creation", () => {
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

  test("validate the basic fields", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/name.*required/i)).toBeVisible();
    await expect(page.getByText(/slug.*required/i)).toBeVisible();
    await expect(page.getByText(/base unit.*required/i)).toBeVisible();
    await expect(page.getByText(/dosage form.*required/i)).toBeVisible();
  });

  test("validate all fields", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();
    await page.getByRole("button", { name: "Add Guideline" }).click();
    await page.getByRole("button", { name: "Add Name" }).click();

    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/slug.*required/i)).toBeVisible();
    await expect(page.getByText(/base unit.*required/i)).toBeVisible();
    await expect(page.getByText(/dosage form.*required/i)).toBeVisible();
    await expect(page.getByText("name is required")).toBeVisible();
    await expect(page.getByText(/note.*required/i)).toBeVisible();
    await expect(page.getByText(/duration value.*required/i)).toBeVisible();
  });

  test("create a product knowledge with required fields only", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /add product/i }).click();

    // Basic details
    await page.getByRole("textbox", { name: /name/i }).fill(testData.name);
    await page.getByRole("textbox", { name: /slug/i }).fill(testData.slug);

    // Scroll to Base Unit if not visible
    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: testData.baseUnit }).click();
    await page.keyboard.press("Escape");

    // Scroll to Dosage Form if not visible
    await page
      .getByRole("combobox", { name: /dosage form/i })
      .scrollIntoViewIfNeeded();
    await page.getByRole("combobox", { name: /dosage form/i }).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible();

    await page
      .getByRole("textbox", { name: "Search products" })
      .fill(testData.name);
    await expect(
      page.getByRole("table").getByText(testData.name),
    ).toBeVisible();

    await page.getByRole("link", { name: "View" }).first().click();
    await expect(
      page.getByRole("heading").getByText(testData.name),
    ).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(
      page.getByRole("textbox", { name: /name/i }).first(),
    ).toHaveValue(testData.name);

    await expect(
      page.getByRole("textbox", { name: /slug/i }).first(),
    ).toHaveValue(testData.slug.toLowerCase());
  });

  test("create a product knowledge with all fields", async ({ page }) => {
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

    await page
      .getByRole("textbox", { name: "Search products" })
      .fill(testData.name);
    await expect(
      page.getByRole("table").getByText(testData.name),
    ).toBeVisible();

    // View and verify all details
    await page.getByRole("link", { name: "View" }).first().click();
    await expect(
      page.getByRole("heading").getByText(testData.name),
    ).toBeVisible();
    await expect(page.getByText(testData.altNames)).toBeVisible();
    await expect(page.getByText(testData.storageGuidelines)).toBeVisible();
    await expect(page.getByText(testData.productType)).toBeVisible();
    await expect(page.getByText(testData.baseUnit)).toBeVisible();
    await expect(page.getByText(testData.hsnCode)).toBeVisible();
  });
});
