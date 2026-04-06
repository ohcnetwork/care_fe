import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Knowledge Creation", () => {
  let facilityId: string;

  let name: string;
  let slug: string;
  let productType: string;
  let baseUnit: string;
  let hsnCode: string;
  let altNames: string;
  let storageGuidelines: string;
  let categoryName: string;
  let dosageForm: string;

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

  const dosageFormOptions = [
    "Prolonged-release intracameral implant",
    "Powder for conventional release intravesical solution and solution for injection",
    "Conventional release intravesical solution and solution for injection",
    "Prolonged-release intravitreal implant",
    "Chewable and/or dispersible oral tablet",
  ];

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const productName = faker.commerce.productName();

    name = productName;
    slug = productName.replace(/\s+/g, "-").slice(0, 25);
    productType = faker.helpers.arrayElement(productTypeOptions);
    baseUnit = faker.helpers.arrayElement(baseUnitOptions);
    dosageForm = faker.helpers.arrayElement(dosageFormOptions);
    hsnCode = faker.string.numeric({ length: 8 });
    altNames = productName + "Alt";
    storageGuidelines = faker.commerce.productDescription();
    categoryName = "Medications";

    await page.goto(`/facility/${facilityId}/settings/product_knowledge`);
    await page.getByRole("heading", { name: categoryName }).click();
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
    await page.getByRole("textbox", { name: /name/i }).fill(name);
    await page.getByRole("textbox", { name: /slug/i }).fill(slug);

    // Scroll to Base Unit if not visible
    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: baseUnit }).click();
    await page.keyboard.press("Escape");

    // Scroll to Dosage Form if not visible
    await page
      .getByRole("combobox", { name: /dosage form/i })
      .scrollIntoViewIfNeeded();
    await page.getByRole("combobox", { name: /dosage form/i }).click();
    await page.getByPlaceholder("Select Dosage Form").fill(dosageForm);
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible();

    await page.getByRole("textbox", { name: "Search products" }).fill(name);
    await expect(page.getByRole("table").getByText(name)).toBeVisible();

    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page.getByRole("heading").getByText(name)).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(
      page.getByRole("textbox", { name: /name/i }).first(),
    ).toHaveValue(name);

    await expect(
      page.getByRole("textbox", { name: /slug/i }).first(),
    ).toHaveValue(slug.toLowerCase());
  });

  test("create a product knowledge with all fields", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();

    // Basic details
    await page.getByRole("textbox", { name: /name/i }).fill(name);
    await page.getByRole("textbox", { name: /slug/i }).fill(slug);
    await page.getByRole("combobox", { name: /product type/i }).click();
    await page.getByRole("option", { name: productType }).click();
    await page.getByText(/Base Unit/).click();
    await page.getByRole("option", { name: baseUnit }).click();
    await page.getByRole("textbox", { name: "HSN Code" }).fill(hsnCode);

    // Alternate names and storage guidelines
    await page.getByRole("button", { name: "Add Name" }).click();
    await page.locator('input[name="names.0.name"]').fill(altNames);

    await page.getByRole("button", { name: "Add Guideline" }).click();
    await page.getByRole("textbox", { name: "Note" }).fill(storageGuidelines);
    await page.getByRole("spinbutton", { name: "Duration Value" }).fill("2");

    // Dosage form
    await page.getByRole("combobox", { name: /dosage form/i }).click();
    await page.getByPlaceholder("Select Dosage Form").fill(dosageForm);
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(/created successfully/i)).toBeVisible();

    await page.getByRole("textbox", { name: "Search products" }).fill(name);
    await expect(page.getByRole("table").getByText(name)).toBeVisible();

    // View and verify all details
    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page.getByRole("heading").getByText(name)).toBeVisible();
    await expect(page.getByText(altNames)).toBeVisible();
    await expect(page.getByText(storageGuidelines)).toBeVisible();
    await expect(page.getByText(productType)).toBeVisible();
    await expect(page.getByText(baseUnit)).toBeVisible();
    await expect(page.getByText(hsnCode)).toBeVisible();
    await expect(page.getByText(dosageForm)).toBeVisible();
  });
});
