import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Component ↔ Charge Item Definition Integration", () => {
  let facilityId: string;
  let discountComponentName: string;
  let chargeItemTitle: string;
  let chargeItemSlug: string;
  let basePrice: string;
  let categoryName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    discountComponentName = `Discount-${faker.commerce.productAdjective()}-${faker.number.int({ min: 1000, max: 9999 })}`;
    chargeItemTitle = faker.commerce.productName();
    chargeItemSlug = chargeItemTitle.replace(/\s+/g, "-").slice(0, 25);
    basePrice = faker.commerce.price({ dec: 0 });
    categoryName = "Medications";

    await page.goto(`/facility/${facilityId}/settings/billing/discount_components`);
  });

  test("discount component appears in charge item definition selector", async ({
    page,
  }) => {
    // Step 1: Create a discount component
    await page.getByRole("button", { name: /create discount component/i }).click();
    
    await page.getByRole("textbox", { name: /name/i }).fill(discountComponentName);
    
    // Set discount factor (10%)
    await page.getByRole("spinbutton").first().fill("10");
    
    await page.getByRole("button", { name: /save/i }).click();

    // Verify discount component was created
    await expect(page.getByText(/discount component.*created/i)).toBeVisible();
    await expect(page.getByText(discountComponentName)).toBeVisible();

    // Step 2: Navigate to Charge Item Definition create flow
    await page.goto(`/facility/${facilityId}/settings/charge_item_definitions/`);
    await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
    await page.getByRole("button", { name: /add definition/i }).click();

    // Fill required fields
    await page.getByRole("textbox", { name: /title/i }).fill(chargeItemTitle);
    await page.getByRole("textbox", { name: /slug/i }).fill(chargeItemSlug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);

    // Step 3: Open Add Discount and verify the created discount component is listed
    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();

    // Assert the discount component is visible in the selector
    await expect(page.getByText(discountComponentName)).toBeVisible();
  });

  test("selected discount component persists on view and edit", async ({
    page,
  }) => {
    // Step 1: Create a discount component
    await page.getByRole("button", { name: /create discount component/i }).click();
    
    await page.getByRole("textbox", { name: /name/i }).fill(discountComponentName);
    
    // Set discount amount (₹50)
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /amount/i }).click();
    await page.getByRole("spinbutton").first().fill("50");
    
    await page.getByRole("button", { name: /save/i }).click();

    // Verify discount component was created
    await expect(page.getByText(/discount component.*created/i)).toBeVisible();

    // Step 2: Create Charge Item Definition with the discount
    await page.goto(`/facility/${facilityId}/settings/charge_item_definitions/`);
    await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
    await page.getByRole("button", { name: /add definition/i }).click();

    await page.getByRole("textbox", { name: /title/i }).fill(chargeItemTitle);
    await page.getByRole("textbox", { name: /slug/i }).fill(chargeItemSlug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);

    // Add the discount component
    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();
    
    // Select the discount component by clicking its checkbox
    await page.getByText(discountComponentName).locator("..").getByRole("checkbox").click();
    await page.getByRole("button", { name: "Done" }).click();

    // Save the charge item definition
    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    // Step 3: Verify discount persists in View mode
    await page.getByRole("textbox", { name: /search/i }).fill(chargeItemTitle);
    await expect(page.getByRole("table").getByText(chargeItemTitle)).toBeVisible();
    
    await page.getByRole("link", { name: "View" }).click();
    await expect(page.getByRole("heading", { name: chargeItemTitle })).toBeVisible();
    
    // Verify discount component is shown in the view
    await expect(page.getByText(discountComponentName)).toBeVisible();

    // Step 4: Verify discount persists in Edit mode
    await page.getByRole("button", { name: "Edit" }).first().click();
    
    // Verify the discount component is still selected
    await expect(page.getByText(discountComponentName)).toBeVisible();
  });

  test("conditional discount component can be attached and persists", async ({
    page,
  }) => {
    // Step 1: Create a conditional discount component
    await page.getByRole("button", { name: /create discount component/i }).click();
    
    await page.getByRole("textbox", { name: /name/i }).fill(discountComponentName);
    
    // Set discount factor (15%)
    await page.getByRole("spinbutton").first().fill("15");

    // Add a condition: Patient Age in range 60-120
    await page.getByRole("button", { name: "Add Condition" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: /^Metric|Encounter/ })
      .click();
    await page.getByRole("option", { name: "Patient Age" }).click();
    await page.getByRole("combobox").filter({ hasText: "In range" }).click();
    await page.getByRole("option", { name: "In range" }).click();
    await page.getByPlaceholder("Min").fill("60");
    await page.getByPlaceholder("Max").fill("120");
    await page.getByRole("button", { name: "Add" }).click();
    
    await page.getByRole("button", { name: /save/i }).click();

    // Verify discount component was created
    await expect(page.getByText(/discount component.*created/i)).toBeVisible();

    // Step 2: Create Charge Item Definition with the conditional discount
    await page.goto(`/facility/${facilityId}/settings/charge_item_definitions/`);
    await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
    await page.getByRole("button", { name: /add definition/i }).click();

    await page.getByRole("textbox", { name: /title/i }).fill(chargeItemTitle);
    await page.getByRole("textbox", { name: /slug/i }).fill(chargeItemSlug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);

    // Add the conditional discount component
    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();
    
    await page.getByText(discountComponentName).locator("..").getByRole("checkbox").click();
    await page.getByRole("button", { name: "Done" }).click();

    // Save the charge item definition
    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    // Step 3: Verify conditional discount persists in Edit mode
    await page.getByRole("textbox", { name: /search/i }).fill(chargeItemTitle);
    await page.getByRole("link", { name: "View" }).click();
    await page.getByRole("button", { name: "Edit" }).first().click();
    
    // Verify the conditional discount component is still selected
    await expect(page.getByText(discountComponentName)).toBeVisible();
    
    // Verify the condition is displayed (Patient Age in range)
    await expect(
      page.getByText("Patient Age is in range 60 to 120 years"),
    ).toBeVisible();
  });

  test("multiple discount components can be attached to charge item definition", async ({
    page,
  }) => {
    const discountComponentName2 = `Discount-${faker.commerce.productAdjective()}-${faker.number.int({ min: 1000, max: 9999 })}`;

    // Step 1: Create first discount component (percentage)
    await page.getByRole("button", { name: /create discount component/i }).click();
    await page.getByRole("textbox", { name: /name/i }).fill(discountComponentName);
    await page.getByRole("spinbutton").first().fill("10");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/discount component.*created/i)).toBeVisible();

    // Step 2: Create second discount component (amount)
    await page.getByRole("button", { name: /create discount component/i }).click();
    await page.getByRole("textbox", { name: /name/i }).fill(discountComponentName2);
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /amount/i }).click();
    await page.getByRole("spinbutton").first().fill("25");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/discount component.*created/i)).toBeVisible();

    // Step 3: Create Charge Item Definition with both discounts
    await page.goto(`/facility/${facilityId}/settings/charge_item_definitions/`);
    await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
    await page.getByRole("button", { name: /add definition/i }).click();

    await page.getByRole("textbox", { name: /title/i }).fill(chargeItemTitle);
    await page.getByRole("textbox", { name: /slug/i }).fill(chargeItemSlug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);

    // Add both discount components
    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();
    
    await page.getByText(discountComponentName).locator("..").getByRole("checkbox").click();
    await page.getByText(discountComponentName2).locator("..").getByRole("checkbox").click();
    await page.getByRole("button", { name: "Done" }).click();

    // Save the charge item definition
    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    // Step 4: Verify both discounts persist
    await page.getByRole("textbox", { name: /search/i }).fill(chargeItemTitle);
    await page.getByRole("link", { name: "View" }).click();
    
    await expect(page.getByText(discountComponentName)).toBeVisible();
    await expect(page.getByText(discountComponentName2)).toBeVisible();

    // Verify in edit mode
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByText(discountComponentName)).toBeVisible();
    await expect(page.getByText(discountComponentName2)).toBeVisible();
  });

  test("discount component can be removed from charge item definition", async ({
    page,
  }) => {
    // Step 1: Create a discount component
    await page.getByRole("button", { name: /create discount component/i }).click();
    await page.getByRole("textbox", { name: /name/i }).fill(discountComponentName);
    await page.getByRole("spinbutton").first().fill("5");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/discount component.*created/i)).toBeVisible();

    // Step 2: Create Charge Item Definition with the discount
    await page.goto(`/facility/${facilityId}/settings/charge_item_definitions/`);
    await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
    await page.getByRole("button", { name: /add definition/i }).click();

    await page.getByRole("textbox", { name: /title/i }).fill(chargeItemTitle);
    await page.getByRole("textbox", { name: /slug/i }).fill(chargeItemSlug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);

    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();
    
    await page.getByText(discountComponentName).locator("..").getByRole("checkbox").click();
    await page.getByRole("button", { name: "Done" }).click();

    await page.getByRole("button", { name: /create/i }).click();
    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    // Step 3: Edit and remove the discount
    await page.getByRole("textbox", { name: /search/i }).fill(chargeItemTitle);
    await page.getByRole("link", { name: "View" }).click();
    await page.getByRole("button", { name: "Edit" }).first().click();

    // Open discount selector and uncheck the discount
    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();
    
    await page.getByText(discountComponentName).locator("..").getByRole("checkbox").click();
    await page.getByRole("button", { name: "Done" }).click();

    // Save changes
    await page.getByRole("button", { name: /update/i }).click();
    await expect(
      page.getByText(/charge item definition.*updated successfully/i),
    ).toBeVisible();

    // Step 4: Verify discount is removed
    await page.getByRole("textbox", { name: /search/i }).fill(chargeItemTitle);
    await page.getByRole("link", { name: "View" }).click();
    
    // Discount component should not be visible
    await expect(page.getByText(discountComponentName)).not.toBeVisible();
  });
});
