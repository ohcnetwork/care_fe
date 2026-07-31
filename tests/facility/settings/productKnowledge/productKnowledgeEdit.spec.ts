import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

const baseUnitOptions = [
  "tablets",
  "milligram",
  "microgram",
  "milliliter",
  "drop",
  "international unit",
];

const dosageFormOptions = [
  "Prolonged-release intracameral implant",
  "Prolonged-release intravitreal implant",
  "Chewable and/or dispersible oral tablet",
];

async function createProduct(page: Page, facilityId: string): Promise<string> {
  const productName = "Edit-" + faker.string.alphanumeric(8);
  const slug = productName.toLowerCase().replace(/\s+/g, "-");
  const baseUnit = faker.helpers.arrayElement(baseUnitOptions);
  const dosageForm = faker.helpers.arrayElement(dosageFormOptions);

  await page.goto(`/facility/${facilityId}/settings/product_knowledge`);
  await page.getByRole("heading", { name: "Consumables" }).click();
  await page.getByRole("button", { name: /add product/i }).click();

  await page.getByRole("textbox", { name: /name/i }).fill(productName);
  await page.getByRole("textbox", { name: /slug/i }).fill(slug);
  await page.getByText(/Base Unit/).click();
  await page.getByRole("option", { name: baseUnit }).click();
  await page.keyboard.press("Escape");

  await page
    .getByRole("combobox", { name: /dosage form/i })
    .scrollIntoViewIfNeeded();
  await page.getByRole("combobox", { name: /dosage form/i }).click();
  await page.getByPlaceholder("Select Dosage Form").fill(dosageForm);
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: /create/i }).click();

  await expect(page.getByText(/created successfully/i)).toBeVisible();
  return productName;
}

test.describe("Product Knowledge Edit operations", () => {
  let facilityId: string;

  const productTypeOptions = [
    "Medication",
    "Nutritional Product",
    "Consumable",
  ];

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test("view and edit and confirm", async ({ page }) => {
    const productName = await createProduct(page, facilityId);

    // Search and navigate to the created product
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill(productName);
    await page
      .getByRole("row")
      .filter({ hasText: productName })
      .getByRole("link", { name: "View" })
      .click();
    await page.getByRole("button", { name: "Edit" }).click();

    const editedName = productName + " Edited";
    const productType = faker.helpers.arrayElement(productTypeOptions);
    const baseUnit = faker.helpers.arrayElement(baseUnitOptions);
    const hsnCode = faker.string.numeric({ length: 8 });
    const altNames = productName + "Alt";
    const storageGuidelines = faker.commerce.productDescription();

    await page.getByRole("textbox", { name: /name/i }).first().fill(editedName);
    await page.getByRole("combobox", { name: /product type/i }).click();
    await page.getByRole("option", { name: productType }).click();

    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: baseUnit }).click();
    await page.getByRole("textbox", { name: "HSN Code" }).fill(hsnCode);

    // Fresh product won't have alt names or guidelines
    await page.getByRole("button", { name: "Add Name" }).click();
    await page.locator('input[name="names.0.name"]').fill(altNames);

    await page.getByRole("button", { name: "Add Guideline" }).click();
    await page.getByRole("textbox", { name: "Note *" }).fill(storageGuidelines);
    await page.getByRole("spinbutton", { name: "Duration Value" }).fill("30");

    await page.getByRole("button", { name: /update/i }).click();
    await page.waitForURL(/\/product_knowledge\/[^/]+$/);

    await expect(page.getByRole("heading").getByText(editedName)).toBeVisible();

    // Navigate back and verify in the list
    await page.goto(`/facility/${facilityId}/settings/product_knowledge/`);
    await page.getByRole("heading", { name: "Consumables" }).click();

    await expect(async () => {
      const searchBox = page.getByRole("textbox", { name: "Search products" });
      await searchBox.fill(editedName);
      await expect(page.getByRole("table").getByText(editedName)).toBeVisible();
    }).toPass({ intervals: [1_000, 2_000, 3_000], timeout: 15_000 });

    await page
      .getByRole("row")
      .filter({ hasText: editedName })
      .getByRole("link", { name: "View" })
      .click();

    // Verify all the fields
    await expect(page.getByText(editedName)).toBeVisible();
    await expect(page.getByText(productType)).toBeVisible();
    await expect(page.getByText(baseUnit)).toBeVisible();
    await expect(page.getByText(hsnCode)).toBeVisible();
    await expect(page.getByText(altNames)).toBeVisible();
    await expect(page.getByText(storageGuidelines)).toBeVisible();
  });
});
