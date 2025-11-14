import { expect, test } from "@playwright/test";

// Use authenticated state for admin access
test.use({ storageState: "tests/.auth/user.json" });

test.describe("ValueSet Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ValueSets management
    await page.goto("/");
    await page.getByRole("link", { name: "Admin Dashboard" }).click();

    // Navigate to ValueSets page
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("link", { name: "ValueSets" }).click();

    // Start creating new ValueSet
    await page.getByRole("button", { name: "+ Create ValueSets" }).click();
  });

  test("should create a valueset with just required fields", async ({
    page,
  }) => {
    const uniqueName = `Required Fields ValueSet ${Date.now()}`;

    // Fill required fields
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page
      .getByRole("textbox", { name: "Slug *" })
      .fill(`slug-${Date.now()}`);

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

    // Verify success
    await expect(page.getByText("ValueSet created successfully")).toBeVisible();
    await expect(page.getByRole("cell", { name: uniqueName })).toBeVisible();
  });

  test("should create a valueset with all fields", async ({ page }) => {
    const uniqueName = `All Fields ValueSet ${Date.now()}`;
    const uniqueSlug = `all-fields-${Date.now()}`;
    const description =
      "Comprehensive ValueSet with all possible fields filled";

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

    await expect(page.getByText("ValueSet created successfully")).toBeVisible();
    await expect(page.getByRole("cell", { name: uniqueName })).toBeVisible();
  });

  test("should create valueset with include rules - any system with concept only", async ({
    page,
  }) => {
    const uniqueName = `Concept Only ValueSet ${Date.now()}`;

    // Fill basic info
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page
      .getByRole("textbox", { name: "Slug *" })
      .fill(`concept-only-${Date.now()}`);

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
    await expect(page.getByText(/Preview|Codes|Values/i)).toBeVisible();

    // Close preview and save
    await page.getByRole("button", { name: /close|back/i }).click();
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success
    await expect(page.getByText("ValueSet created successfully")).toBeVisible();
  });

  test("should create valueset with include rules - any system with filters", async ({
    page,
  }) => {
    const uniqueName = `Filter Based ValueSet ${Date.now()}`;

    // Fill basic info
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page
      .getByRole("textbox", { name: "Slug *" })
      .fill(`filter-based-${Date.now()}`);

    // Add include rule with filter
    await page
      .getByRole("button", { name: "+ Add Rule", exact: true })
      .first()
      .click();
    await page.getByRole("combobox", { name: "System" }).first().click();
    await page.getByRole("option", { name: "SNOMED CT" }).click();

    // Add filter instead of concepts
    await page.getByRole("button", { name: "+ Add Filter" }).first().click();

    // Fill filter details
    await page.getByRole("combobox", { name: "Property" }).first().click();
    await page
      .getByRole("option", { name: /category|type|class/i })
      .first()
      .click();

    await page.getByRole("combobox", { name: "Operator" }).first().click();
    await page.getByRole("option", { name: "equals" }).click();

    await page.getByRole("textbox", { name: "Value" }).first().fill("disorder");

    // Set status and save
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Active" }).click();

    await page.getByRole("button", { name: "Save" }).click();

    // Verify success
    await expect(page.getByText("ValueSet created successfully")).toBeVisible();
    await expect(page.getByRole("cell", { name: uniqueName })).toBeVisible();
  });

  test("should create valueset with both exclude and include rules", async ({
    page,
  }) => {
    const uniqueName = `Include Exclude ValueSet ${Date.now()}`;

    // Fill basic info
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page
      .getByRole("textbox", { name: "Slug *" })
      .fill(`include-exclude-${Date.now()}`);

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
    await expect(page.getByText(/Preview|Include|Exclude/i)).toBeVisible();

    // Close preview and save
    await page.getByRole("button", { name: /close|back/i }).click();
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success
    await expect(page.getByText("ValueSet created successfully")).toBeVisible();
  });

  test("should test ValueSet Preview functionality comprehensively", async ({
    page,
  }) => {
    const uniqueName = `Preview Test ValueSet ${Date.now()}`;

    // Fill basic info
    await page.getByRole("textbox", { name: "Name *" }).fill(uniqueName);
    await page
      .getByRole("textbox", { name: "Slug *" })
      .fill(`preview-test-${Date.now()}`);

    // Add complex rules for meaningful preview
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
    await page.getByRole("textbox", { name: "Code *" }).nth(1).fill("2339-0");

    // Test Preview
    await page.getByRole("button", { name: "Value Preview" }).click();

    // Verify preview shows expected content
    await expect(page.getByText(/1558-6|Blood glucose/i)).toBeVisible();
    await expect(page.getByText(/2339-0|Glucose/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /close|back/i }),
    ).toBeVisible();

    // Close preview
    await page.getByRole("button", { name: /close|back/i }).click();

    // Verify we're back to form
    await expect(
      page.getByRole("button", { name: "Value Preview" }),
    ).toBeVisible();

    // Cancel instead of saving (as per test plan flexibility)
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("button", { name: "+ Create ValueSets" }),
    ).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    // Try to save without required fields
    await page.getByRole("button", { name: "Save" }).click();

    // Verify validation errors
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Slug is required")).toBeVisible();
    await expect(
      page.getByText("At least one include rule is required"),
    ).toBeVisible();

    // Fill only name
    await page.getByRole("textbox", { name: "Name *" }).fill("Test Name");
    await page.getByRole("button", { name: "Save" }).click();

    // Should still show slug and include rule errors
    await expect(page.getByText("Slug is required")).toBeVisible();
    await expect(
      page.getByText("At least one include rule is required"),
    ).toBeVisible();
  });

  test("should handle cancel operation correctly", async ({ page }) => {
    // Fill some data
    await page
      .getByRole("textbox", { name: "Name *" })
      .fill("Cancel Test ValueSet");
    await page.getByRole("textbox", { name: "Slug *" }).fill("cancel-test");

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
    await expect(
      page.getByRole("cell", { name: "Cancel Test ValueSet" }),
    ).not.toBeVisible();
  });
});
