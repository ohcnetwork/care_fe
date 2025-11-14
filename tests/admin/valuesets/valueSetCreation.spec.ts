import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("ValueSet Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home
    await page.goto("/");

    // Go to Admin Dashboard
    const adminDashboardLink = page.getByRole("link", {
      name: "Admin Dashboard",
    });
    await expect(adminDashboardLink).toBeVisible();
    await adminDashboardLink.click();

    // Wait for Admin Dashboard to be visible
    await expect(
      page.getByRole("heading", { name: /Admin Dashboard/i }),
    ).toBeVisible();

    // Navigate to ValueSets page
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("link", { name: "ValueSets" }).click();

    // Wait for ValueSets list to load
    const createButton = page.getByRole("button", {
      name: "+ Create ValueSets",
    });
    await expect(createButton).toBeVisible();

    // Start creating new ValueSet
    await createButton.click();

    // Wait for creation form to be ready
    await expect(page.getByRole("textbox", { name: "Name *" })).toBeVisible();
  });

  test("should create a valueset with just required fields", async ({
    page,
  }) => {
    const uniqueSuffix = faker.string.alphanumeric(8).toLowerCase();
    const uniqueName = `Required Fields ValueSet ${uniqueSuffix}`;
    const uniqueSlug = `required-fields-${uniqueSuffix}`;

    // Fill required fields
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page.getByRole("textbox", { name: "Slug *" }).fill(uniqueSlug);

    // Add at least one include rule (required)
    await page
      .getByRole("button", { name: "+ Add Rule", exact: true })
      .first()
      .click();

    // Select coding system
    await page.getByRole("combobox", { name: "System" }).first().click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    // Add a concept
    await page.getByRole("button", { name: "+ Add Concepts" }).first().click();
    await page
      .getByRole("textbox", { name: "Code *" })
      .first()
      .fill("73211009");

    // Set status
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Active" }).click();

    // Save the ValueSet
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success with proper waiting
    await expect(page.getByText("ValueSet created successfully")).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByRole("cell", { name: uniqueName })).toBeVisible();
  });

  test("should create a valueset with all fields", async ({ page }) => {
    const uniqueSuffix = faker.string.alphanumeric(8).toLowerCase();
    const uniqueName = `All Fields ValueSet ${uniqueSuffix}`;
    const uniqueSlug = `all-fields-${uniqueSuffix}`;
    const description = faker.lorem.sentence();

    // Fill all basic fields
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page.getByRole("textbox", { name: "Slug *" }).fill(uniqueSlug);
    await page.getByRole("textbox", { name: "Description" }).fill(description);

    // Set status
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Draft" }).click();

    // Add include rule with concepts
    await page
      .getByRole("button", { name: "+ Add Rule", exact: true })
      .first()
      .click();
    await page.getByRole("combobox", { name: "System" }).first().click();
    await page.getByRole("option", { name: "LOINC" }).click();

    // Add multiple concepts
    await page.getByRole("button", { name: "+ Add Concepts" }).first().click();
    await page.getByRole("textbox", { name: "Code *" }).first().fill("1558-6");

    await page.getByRole("button", { name: "+ Add Concepts" }).first().click();
    const secondConcept = page.getByRole("textbox", { name: "Code *" }).nth(1);
    await secondConcept.fill("2339-0");

    // Save and verify
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("ValueSet created successfully")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("cell", { name: uniqueName })).toBeVisible();
  });

  test("should create valueset with include rules - any system with concept only", async ({
    page,
  }) => {
    const uniqueSuffix = faker.string.alphanumeric(8).toLowerCase();
    const uniqueName = `Concept Only ValueSet ${uniqueSuffix}`;
    const uniqueSlug = `concept-only-${uniqueSuffix}`;

    // Fill basic info
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page.getByRole("textbox", { name: "Slug *" }).fill(uniqueSlug);

    // Add include rule with SNOMED concept
    await page
      .getByRole("button", { name: "+ Add Rule", exact: true })
      .first()
      .click();
    await page.getByRole("combobox", { name: "System" }).first().click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    // Add concept and verify it's properly added
    await page.getByRole("button", { name: "+ Add Concepts" }).first().click();
    const conceptCode = "73211009"; // Diabetes mellitus SNOMED code
    await page
      .getByRole("textbox", { name: "Code *" })
      .first()
      .fill(conceptCode);

    // Set status
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Active" }).click();

    // Verify concept is properly set before saving
    await expect(
      page.getByRole("textbox", { name: "Code *" }).first(),
    ).toHaveValue(conceptCode);

    // Test ValueSet Preview
    await page.getByRole("button", { name: "Value Preview" }).click();

    // Verify preview dialog opened
    const previewDialog = page
      .locator('[data-testid="preview-dialog"]')
      .first();
    await expect(previewDialog).toBeVisible();

    // Verify specific codes appear in preview
    await expect(previewDialog.getByText(conceptCode)).toBeVisible();

    // Close preview and save
    await previewDialog.getByRole("button", { name: /close|back/i }).click();
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success
    await expect(page.getByText("ValueSet created successfully")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should create valueset with include rules - any system with filters", async ({
    page,
  }) => {
    const uniqueSuffix = faker.string.alphanumeric(8).toLowerCase();
    const uniqueName = `Filter Based ValueSet ${uniqueSuffix}`;
    const uniqueSlug = `filter-based-${uniqueSuffix}`;

    // Fill basic info
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page.getByRole("textbox", { name: "Slug *" }).fill(uniqueSlug);

    // Add include rule with filter
    await page
      .getByRole("button", { name: "+ Add Rule", exact: true })
      .first()
      .click();
    await page.getByRole("combobox", { name: "System" }).first().click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    // Add filter instead of concepts
    await page.getByRole("button", { name: "+ Add Filter" }).first().click();

    // Fill filter details - use specific known properties
    await page.getByRole("combobox", { name: "Property" }).first().click();
    await page.getByRole("option", { name: "concept" }).first().click();

    await page.getByRole("combobox", { name: "Operator" }).first().click();
    await page.getByRole("option", { name: "equals" }).click();

    await page.getByRole("textbox", { name: "Value" }).first().fill("disorder");

    // Set status
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Active" }).click();

    // Open preview and verify (as requested in review)
    await page.getByRole("button", { name: "Value Preview" }).click();
    const previewDialog = page
      .locator('[data-testid="preview-dialog"]')
      .first();
    await expect(previewDialog).toBeVisible();
    await expect(previewDialog.getByRole("table")).toBeVisible();

    await previewDialog.getByRole("button", { name: /close|back/i }).click();

    // Save
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success
    await expect(page.getByText("ValueSet created successfully")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("cell", { name: uniqueName })).toBeVisible();
  });

  test("should create valueset with both exclude and include rules", async ({
    page,
  }) => {
    const uniqueSuffix = faker.string.alphanumeric(8).toLowerCase();
    const uniqueName = `Include Exclude ValueSet ${uniqueSuffix}`;
    const uniqueSlug = `include-exclude-${uniqueSuffix}`;

    // Fill basic info
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page.getByRole("textbox", { name: "Slug *" }).fill(uniqueSlug);

    // ADD INCLUDE RULES
    await page
      .getByRole("button", { name: "+ Add Rule", exact: true })
      .first()
      .click();
    await page.getByRole("combobox", { name: "System" }).first().click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    // Add include concepts
    await page.getByRole("button", { name: "+ Add Concepts" }).first().click();
    await page
      .getByRole("textbox", { name: "Code *" })
      .first()
      .fill("73211009"); // Diabetes

    // ADD EXCLUDE RULES
    await page
      .getByRole("button", { name: "+ Add Rule", exact: true })
      .nth(1)
      .click();
    await page.getByRole("combobox", { name: "System" }).nth(1).click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    // Add exclude concepts
    await page.getByRole("button", { name: "+ Add Concepts" }).nth(1).click();
    await page.getByRole("textbox", { name: "Code *" }).nth(1).fill("46635009"); // Diabetes type 1

    // Set status
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Active" }).click();

    // Test ValueSet Preview to see both include and exclude
    await page.getByRole("button", { name: "Value Preview" }).click();

    // Verify preview dialog opened
    const previewDialog = page
      .locator('[data-testid="preview-dialog"]')
      .first();
    await expect(previewDialog).toBeVisible();

    // Verify specific codes appear
    await expect(previewDialog.getByText("73211009")).toBeVisible(); // include
    await expect(previewDialog.getByText("46635009")).toBeVisible(); // exclude

    // Close preview and save
    await previewDialog.getByRole("button", { name: /close|back/i }).click();
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success
    await expect(page.getByText("ValueSet created successfully")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should validate required fields", async ({ page }) => {
    // Try to save without required fields
    await page.getByRole("button", { name: "Save" }).click();

    // Verify validation errors
    // TODO: when include-rule validation is enforced, extend this test to cover it as well.
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Slug is required")).toBeVisible();

    // Fill only name
    const name = faker.person.fullName();
    await page.getByRole("textbox", { name: "Name *" }).fill(name);
    await page.getByRole("button", { name: "Save" }).click();

    // Should still show slug error
    // TODO: add include-rule validation here in the future if needed.
    await expect(page.getByText("Slug is required")).toBeVisible();
  });

  test("should handle cancel operation correctly", async ({ page }) => {
    // Fill some data
    const suffix = faker.string.alphanumeric(8).toLowerCase();
    const testName = `Cancel Test ValueSet ${suffix}`;
    const testSlug = `cancel-test-${suffix}`;

    await page.getByRole("textbox", { name: "Name *" }).fill(testName);
    await page.getByRole("textbox", { name: "Slug *" }).fill(testSlug);

    // Click cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify navigation back to ValueSets list
    await expect(
      page.getByRole("button", { name: "+ Create ValueSets" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /ValueSets/i }),
    ).toBeVisible();

    // Verify data was not saved by checking the list
    await expect(page.getByRole("table")).toBeVisible();

    // Then verify our test data isn't present in the table
    await expect(page.getByRole("cell", { name: testName })).toHaveCount(0);
  });
});
