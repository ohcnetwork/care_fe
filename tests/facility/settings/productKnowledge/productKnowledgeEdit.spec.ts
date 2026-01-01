import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Knowledge Edit operations", () => {
  let facilityId: string;
  let name: string;
  let productType: string;
  let baseUnit: string;
  let hsnCode: string;
  let altNames: string;
  let storageGuidelines: string;
  let categoryName: string;

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

    name = productName + " Edited";
    productType = faker.helpers.arrayElement(productTypeOptions);
    baseUnit = faker.helpers.arrayElement(baseUnitOptions);
    hsnCode = faker.string.numeric({ length: 8 });
    altNames = productName + "Alt";
    storageGuidelines = faker.commerce.productDescription();
    categoryName = "Medications";

    await page.goto(`/facility/${facilityId}/settings/product_knowledge`);
    await page.getByRole("heading", { name: categoryName }).click();
  });

  test("view and edit and confirm", async ({ page }) => {
    await page.getByRole("link", { name: "View" }).first().click();
    await page.getByRole("button", { name: "Edit" }).click();

    await page.getByRole("textbox", { name: /name/i }).first().fill(name);
    await page.getByRole("combobox", { name: /product type/i }).click();
    await page.getByRole("option", { name: productType }).click();

    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: baseUnit }).click();
    await page.getByRole("textbox", { name: "HSN Code" }).fill(hsnCode);

    // Handle alternative names
    const noAltNamesText = await page.getByText("No alternative names added");
    if (await noAltNamesText.isVisible()) {
      await page.getByRole("button", { name: "Add Name" }).click();
      await page.locator('input[name="names.0.name"]').fill(altNames);
    } else {
      // If alternative names already exist, find the first alternative name input and fill it
      await page
        .locator('input[name^="names"][name$="name"]')
        .first()
        .fill(altNames);
    }

    // Handle storage guidelines
    const noGuidelinesText = await page.getByText(
      "No storage guidelines added",
    );
    if (await noGuidelinesText.isVisible()) {
      await page.getByRole("button", { name: "Add Guideline" }).click();
      await page
        .getByRole("textbox", { name: "Note *" })
        .fill(storageGuidelines);
      await page.getByRole("spinbutton", { name: "Duration Value" }).fill("30");
    } else {
      // If guidelines already exist, find the first note input and fill it
      await page
        .getByRole("textbox", { name: "Note *" })
        .first()
        .fill(storageGuidelines);
      await page
        .getByRole("spinbutton", { name: "Duration Value" })
        .first()
        .fill("30");
    }
    await page.getByRole("button", { name: /update/i }).click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    await expect(page.getByRole("heading").getByText(name)).toBeVisible();
    await page.getByRole("link", { name: "Back" }).click();

    await page.getByRole("textbox", { name: "Search products" }).fill(name);
    await expect(page.getByRole("table").getByText(name)).toBeVisible();

    await page.getByRole("link", { name: "View" }).click();

    // Verify all the fields
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(productType)).toBeVisible();
    await expect(page.getByText(baseUnit)).toBeVisible();
    await expect(page.getByText(hsnCode)).toBeVisible();
    await expect(page.getByText(altNames)).toBeVisible();
    await expect(page.getByText(storageGuidelines)).toBeVisible();
  });
});
