import { faker } from "@faker-js/faker";

import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Observation Definition Form with Interpretation", () => {
  let facilityId: string;

  // Generate unique observation definition data
  function generateObservationData() {
    const timestamp = Date.now();
    const title = faker.lorem.words(2);
    return {
      title,
      slug: title,
      description: `Test observation definition description ${timestamp}`,
      category: "vital-signs",
      status: "active",
      dataType: "quantity",
    };
  }

  // Helper to fill basic observation definition form fields
  async function fillBasicObservationForm(
    page: any,
    data: ReturnType<typeof generateObservationData>,
  ) {
    await test.step("Fill basic observation definition fields", async () => {
      // Fill title
      await page.getByRole("textbox", { name: "Title" }).fill(data.title);

      // Fill description
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(data.description);

      // Select category
      await page.getByRole("combobox", { name: "Category" }).click();
      await page.getByRole("option", { name: "Laboratory" }).first().click();

      // Select status
      await page.getByRole("combobox", { name: "Status" }).click();
      await page.getByRole("option", { name: "Active" }).first().click();

      // Select data type
      await page.getByRole("combobox", { name: "Data Type" }).click();
      await page.getByRole("option", { name: "Integer" }).first().click();

      // Select LOINC code (search and select first available)
      await page.getByRole("combobox", { name: "LOINC Code *" }).click();
      // Wait for search results and select first option
      await page.waitForTimeout(1000); // Wait for search to load
      const firstCodeOption = page.getByRole("option").first();
      await firstCodeOption.click();
    });
  }

  // Helper to add condition with Patient Gender
  async function addGenderCondition(
    page: any,
    conditionNumber: number,
    gender: string = "Male",
  ) {
    await test.step("Add gender condition", async () => {
      const conditionSelector = page.getByText(
        `Condition ${conditionNumber}Type`,
      );
      const conditionSelectorExists = await conditionSelector.isVisible();
      if (!conditionSelectorExists) {
        await page.getByRole("button", { name: "Add Condition" }).click();
      }
      // Select metric type
      await conditionSelector
        .getByRole("combobox")
        .filter({ hasText: /^Encounter/ })
        .click();

      await page.getByRole("option", { name: "Patient Gender" }).click();

      // Select comparator
      await conditionSelector.getByRole("combobox").nth(1).click();
      await page.getByRole("option", { name: "Equals to" }).click();

      // Select gender value
      await conditionSelector.getByRole("combobox").nth(2).click();
      await page.getByRole("option", { name: gender, exact: true }).click();
    });
  }

  // Helper to add condition with Patient Age
  async function addAgeCondition(
    page: any,
    conditionNumber: number,
    operation: "equality" | "in_range",
    value?: number,
    min?: number,
    max?: number,
    ageType: string = "years",
  ) {
    await test.step("Add age condition", async () => {
      const conditionSelector = await page.getByText(
        `Condition ${conditionNumber}Type`,
      );

      // Select metric type
      await conditionSelector.getByRole("combobox").nth(0).click();
      await page.getByRole("option", { name: "Patient Age" }).click();

      // Select comparator
      await conditionSelector.getByRole("combobox").nth(1).click();
      await page
        .getByRole("option", {
          name: operation === "equality" ? "Equals to" : "In Range",
        })
        .click();

      if (operation === "equality" && value !== undefined) {
        // Fill value
        await page
          .getByRole("spinbutton", { name: "Value" })
          .fill(value.toString());
        // Select age type
        await page.getByRole("combobox").filter({ hasText: ageType }).click();
        await conditionSelector.getByRole("option", { name: ageType }).click();
      } else if (operation === "in_range") {
        if (min !== undefined) {
          await conditionSelector.getByPlaceholder("Min").fill(min.toString());
        }
        if (max !== undefined) {
          await conditionSelector.getByPlaceholder("Max").fill(max.toString());
        }
        // Select age type
        //await page.getByRole("combobox").filter({ hasText: "Years" }).click();
        //await conditionSelector.getByRole("combobox").nth(2).click();
        //await page.getByRole("option", { name: ageType }).click();
      }
    });
  }

  // Helper to add numeric range
  async function addNumericRange(
    page: any,
    rangeNumber: number,
    isComponent: boolean,
    display: string,
    min?: number,
    max?: number,
    color?: string,
  ) {
    await test.step("Add numeric range", async () => {
      const rangeSelector = page.getByText(
        `Range ${rangeNumber}DisplayIconColorSelect`,
      );
      const qualifiedRangesInput = isComponent
        ? `component.0.qualified_ranges.0.ranges.${rangeNumber - 1}`
        : `qualified_ranges.0.ranges.${rangeNumber - 1}`;
      // Fill display
      const displayField = rangeSelector.locator(
        `input[name="${qualifiedRangesInput}.interpretation.display"]`,
      );

      await displayField.fill(display);

      // Fill min if provided
      if (min !== undefined) {
        await rangeSelector
          .locator(`input[name="${qualifiedRangesInput}.min"]`)
          .fill(min.toString());
      }

      // Fill max if provided
      if (max !== undefined) {
        await rangeSelector
          .locator(`input[name="${qualifiedRangesInput}.max"]`)
          .fill(max.toString());
      }

      // Select color if provided
      if (color) {
        await rangeSelector
          .getByRole("combobox")
          .filter({ hasText: "Select a value" })
          .first()
          .click();
        await page.getByRole("option", { name: color }).click();
      }
    });
  }

  async function cancelAndDeleteInterpretation(page: any) {
    await page.getByRole("button", { name: "Cancel" }).click();
    await page
      .locator(".flex.flex-col.sm\\:flex-row")
      .nth(0)
      .locator("button:has(svg.lucide-trash-2)")
      .click();
  }

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const targetUrl = `/facility/${facilityId}/settings/observation_definitions/new`;
    await page.goto(targetUrl);
  });

  test("should create observation definition with root-level interpretation", async ({
    page,
  }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Add root-level interpretation
    await page.getByRole("button", { name: "Add Interpretation" }).click();

    /*     // Wait for sheet to open
    await expect(
      page.getByRole("heading", { name: /Add\/Edit Interpretation/i }),
    ).toBeVisible(); */

    // Add condition
    await addGenderCondition(page, 1, "Male");

    // Add condition - Patient Age
    await page.getByRole("button", { name: "Add Condition" }).click();
    await addAgeCondition(page, 2, "in_range", undefined, 18, 65, "Years");

    // Add numeric range
    await addNumericRange(page, 1, false, "Normal Range", 10, 100, "primary");

    // Save interpretation
    await page.getByRole("button", { name: "Save" }).click();

    // Verify sheet closes
    await expect(
      page.getByRole("heading", { name: "Add/Edit Interpretation" }),
    ).not.toBeVisible();

    // Verify interpretation appears in list
    await expect(
      page.getByText("Observation Interpretation (1)"),
    ).toBeVisible();

    // Submit form
    await page.getByRole("button", { name: "Create" }).click();

    // Wait for success message
    await expect(
      page.getByText("observation definition created successfully"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should create observation definition with component-level interpretation", async ({
    page,
  }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Add component first
    await page
      .getByRole("button", {
        name: "Add your first component",
      })
      .click();

    // Fill component code
    await page.getByRole("combobox", { name: "Code *", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("option").first().click();

    // Select component data type
    await page.getByRole("combobox", { name: "Data Type" }).nth(1).click();
    await page.getByRole("option", { name: "Quantity" }).first().click();

    // Select component unit
    page.getByRole("combobox", { name: "Unit" }).nth(1).click();
    await page.waitForTimeout(1000);
    await page.getByRole("option").first().click();

    // Add component-level interpretation
    await page
      .getByRole("button", { name: "Add Interpretation" })
      .nth(1)
      .click();

    // Wait for sheet to open
    await expect(
      page.getByRole("heading", { name: "Add/Edit Interpretation" }),
    ).toBeVisible();

    // Add condition
    await addGenderCondition(page, 1, "Female");

    // Add numeric range
    await addNumericRange(page, 1, true, "Low", undefined, 50, "Danger");

    // Save interpretation
    await page.getByRole("button", { name: "Save" }).click();

    // Verify interpretation appears
    await expect(
      page.getByText("Observation Interpretation (1)"),
    ).toBeVisible();

    // Submit form
    await page.getByRole("button", { name: "Create" }).click();

    // Wait for success message
    await expect(
      page.getByText("observation definition created successfully"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should enforce mutual exclusivity between root and component interpretations", async ({
    page,
  }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Add root-level interpretation first
    await test.step("Add root-level interpretation", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();
      await addGenderCondition(page, 1, "Male");
      await addNumericRange(page, 1, false, "Normal", 0, 100);
      await page.getByRole("button", { name: "Save" }).click();
    });

    // Add component
    await test.step("Add component", async () => {
      await page
        .getByRole("button", {
          name: "Add your first component",
        })
        .click();

      await page.getByRole("combobox", { name: "Code *", exact: true }).click();
      await page.waitForTimeout(1000);
      await page.getByRole("option").first().click();

      await page.getByRole("combobox", { name: "Data Type" }).nth(1).click();
      await page
        .getByRole("option", { name: /quantity/i })
        .first()
        .click();

      await page.getByRole("combobox", { name: "Unit" }).nth(1).click();
      await page.waitForTimeout(1000);
      await page.getByRole("option").first().click();
    });

    // Verify component interpretation section is disabled
    const componentInterpretationSection = page
      .locator("text=Observation Interpretation")
      .nth(1);
    await expect(componentInterpretationSection).toBeVisible();

    // Check for conflict message
    await expect(
      page.getByText("Root-level observation interpretations exist"),
    ).toBeVisible();

    // Verify Add Interpretation button is disabled or not visible in component section
    await expect(
      page.getByRole("button", { name: "Add Interpretation" }),
    ).toHaveCount(0);

    // Try to clear root-level interpretation
    await test.step("Clear root-level interpretation", async () => {
      await page
        .getByRole("button", { name: "Clear conflicting interpretations" })
        .click();

      // Verify warning dialog appears
      await expect(
        page.getByRole("heading", { name: "Remove Root Observation" }),
      ).toBeVisible();

      // Confirm clearing
      await page.getByRole("button", { name: "Remove" }).click();

      // Verify root interpretation is cleared and component section becomes enabled
      await expect(
        page.getByText("No interpretations configured").nth(0),
      ).toBeVisible();
      // Verify component interpretation section is enabled
      await expect(
        page.getByText("No interpretations configured").nth(1),
      ).toBeVisible();
    });

    // Now add component-level interpretation
    await test.step("Add component-level interpretation after clearing root", async () => {
      // Find the component interpretation section and add interpretation
      const componentAddButton = page
        .getByRole("button", { name: "Add Interpretation" })
        .last();
      await componentAddButton.click();

      await addGenderCondition(page, 1, "Female");
      await addNumericRange(page, 1, true, "Low", undefined, 50);
      await page.getByRole("button", { name: "Save" }).click();

      // Verify component interpretation is added
      await expect(
        page.getByText("Observation Interpretation (1)"),
      ).toBeVisible();
    });
  });

  test("should enforce mutual exclusivity - component blocks root", async ({
    page,
  }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Add component first
    await test.step("Add component with interpretation", async () => {
      await page
        .getByRole("button", {
          name: "Add your first component",
        })
        .click();

      await page.getByRole("combobox", { name: "Code *", exact: true }).click();
      await page.waitForTimeout(1000);
      await page.getByRole("option").first().click();

      await page.getByRole("combobox", { name: "Data Type" }).nth(1).click();
      await page
        .getByRole("option", { name: /quantity/i })
        .first()
        .click();

      page.getByRole("combobox", { name: "Unit" }).nth(1).click();
      await page.waitForTimeout(1000);
      await page.getByRole("option").first().click();

      // Add component-level interpretation
      await page
        .getByRole("button", { name: "Add Interpretation" })
        .nth(1)
        .click();
      await addGenderCondition(page, 1, "Male");
      await addNumericRange(page, 1, true, "Normal", 0, 100);
      await page.getByRole("button", { name: "Save" }).click();
    });

    // Verify root-level interpretation section is disabled
    await test.step("Verify root interpretation is disabled", async () => {
      await expect(
        page.getByText("Component-level observation interpretations exist"),
      ).toBeVisible();

      // Root-level Add Interpretation button should be disabled or conflict message should be visible
      const rootSection = page
        .locator("text=Observation Interpretation")
        .nth(0);
      await expect(rootSection).toBeVisible();
    });

    // Clear component interpretation
    await test.step("Clear component interpretation", async () => {
      await page
        .getByRole("button", { name: "Clear conflicting interpretations" })
        .click();

      await expect(
        page.getByRole("heading", {
          name: "Remove Component Observation Interpretation",
        }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Remove" }).click();

      // Verify component interpretation is cleared
      await expect(page.getByText("No interpretations configured")).toHaveCount(
        2,
      );
    });

    // Now add root-level interpretation
    await test.step("Add root-level interpretation after clearing component", async () => {
      await page
        .getByRole("button", { name: "Add Interpretation" })
        .nth(0)
        .click();

      await addGenderCondition(page, 1, "Female");
      await addNumericRange(page, 1, false, "High", 100, undefined);
      await page.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByText("Observation Interpretation (1)"),
      ).toBeVisible();
    });
  });

  test("should create interpretation with multiple conditions and ranges", async ({
    page,
  }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Add root-level interpretation with multiple conditions and ranges
    await test.step("Add interpretation with multiple conditions and ranges", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();

      // Add first condition - Gender
      await addGenderCondition(page, 1, "Male");

      // Add second condition - Age
      await page.getByRole("button", { name: "Add Condition" }).click();
      await addAgeCondition(page, 2, "in_range", undefined, 18, 65, "Years");

      // Add first range
      await addNumericRange(page, 1, false, "Low", undefined, 50, "Danger");
      await page.getByRole("button", { name: "Add Range" }).click();
      // Add second range
      await addNumericRange(page, 2, false, "Normal", 51, 100, "Blue");
      await page.getByRole("button", { name: "Add Range" }).click();
      // Add third range
      await addNumericRange(page, 3, false, "High", 101, undefined, "Pink");

      // Save interpretation
      await page.getByRole("button", { name: "Save" }).click();

      // Verify interpretation summary shows multiple conditions and ranges
      await expect(
        page.getByText("Observation Interpretation (1)"),
      ).toBeVisible();
    });

    // Submit form
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText("observation definition created successfully"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should edit existing interpretation", async ({ page }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Create initial interpretation
    await test.step("Create initial interpretation", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();
      await addGenderCondition(page, 1, "Male");
      await addNumericRange(page, 1, false, "Normal", 0, 100);
      await page.getByRole("button", { name: "Save" }).click();
    });

    // Edit interpretation
    await test.step("Edit interpretation", async () => {
      await page
        .locator(".flex.flex-col.sm\\:flex-row")
        .nth(0)
        .locator("button:has(svg.lucide-square-pen)")
        .click();

      // Wait for sheet to open
      await expect(
        page.getByRole("heading", { name: "Add/Edit Interpretation" }),
      ).toBeVisible();

      // Modify condition - change gender
      await page.getByRole("combobox").nth(2).click();
      await page.getByRole("option", { name: "Female", exact: true }).click();

      // Modify range - change display

      await page
        .locator(
          'input[name="qualified_ranges.0.ranges.0.interpretation.display"]',
        )
        .fill("Updated Normal");

      // Modify range - change values
      await page
        .locator('input[name="qualified_ranges.0.ranges.0.min"]')
        .fill("10");
      await page
        .locator('input[name="qualified_ranges.0.ranges.0.max"]')
        .fill("90");

      // Save changes
      await page.getByRole("button", { name: "Save" }).click();

      // Verify sheet closes
      await expect(
        page.getByRole("heading", { name: "Add/Edit Interpretation" }),
      ).not.toBeVisible();
    });

    // Submit form
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText("observation definition created successfully"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should delete interpretation", async ({ page }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Create interpretation
    await test.step("Create interpretation", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();
      await addGenderCondition(page, 1, "Male");
      await addNumericRange(page, 1, false, "Normal", 0, 100);
      await page.getByRole("button", { name: "Save" }).click();

      // Verify interpretation appears
      await expect(
        page.getByText("Observation Interpretation (1)"),
      ).toBeVisible();
    });

    // Delete interpretation
    await test.step("Delete interpretation", async () => {
      await page
        .locator(".flex.flex-col.sm\\:flex-row")
        .nth(0)
        .locator("button:has(svg.lucide-trash-2)")
        .click();

      // Verify interpretation is removed
      await expect(
        page.getByText("No interpretations configured"),
      ).toBeVisible();
    });

    // Submit form
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText("observation definition created successfully"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should validate required fields for interpretation", async ({
    page,
  }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Try to save interpretation without conditions
    await test.step("Test validation - no conditions", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();
      await addNumericRange(page, 1, false, "Normal", 0, 100);

      const conditionSelector = page.getByText(`Condition 1Type`);
      const conditionSelectorExists = await conditionSelector.isVisible();
      if (!conditionSelectorExists) {
        await page.getByRole("button", { name: "Add Condition" }).click();
      }

      // Select metric type
      await conditionSelector
        .getByRole("combobox")
        .filter({ hasText: /^Encounter/ })
        .click();

      await page.getByRole("option", { name: "Encounter Tags" }).click();

      await page.getByRole("button", { name: "Save" }).click();
      // tag selector should show error message
      await expect(page.getByText("Tags are required")).toBeVisible();

      await cancelAndDeleteInterpretation(page);
    });

    // Submit empty values for ranges
    await test.step("Test validation - empty range", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();
      await addGenderCondition(page, 1, "Male");

      await page.getByRole("button", { name: "Save" }).click();

      await expect(page.getByText("Display is required")).toBeVisible();
      await expect(
        page.getByText("Either min or max value is required"),
      ).toBeVisible();

      await cancelAndDeleteInterpretation(page);
    });

    // Add condition but remove range
    await test.step("Test validation - no ranges", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();
      await addGenderCondition(page, 1, "Male");

      const rangeSelector = page.getByText(`Range ${1}DisplayIconColorSelect`);

      // Remove the range
      await rangeSelector
        .locator("button:has(svg.lucide-trash-2)")
        .first()
        .click();

      // Save button should be disabled (because no ranges)
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();

      await cancelAndDeleteInterpretation(page);
    });

    // Add range back
    await test.step("Add range to enable save", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();
      await addGenderCondition(page, 1, "Male");
      await addNumericRange(page, 1, false, "Normal", 0, 100);

      // Now save button should be enabled
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeEnabled();

      await saveButton.click();

      // Submit form
      await page.getByRole("button", { name: "Create" }).click();
      await expect(
        page.getByText("observation definition created successfully"),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test("should handle cancel during interpretation edit", async ({ page }) => {
    const data = generateObservationData();

    // Fill basic form
    await fillBasicObservationForm(page, data);

    // Create initial interpretation
    await test.step("Create initial interpretation", async () => {
      await page.getByRole("button", { name: "Add Interpretation" }).click();
      await addGenderCondition(page, 1, "Male");
      await addNumericRange(page, 1, false, "Normal", 0, 100);
      await page.getByRole("button", { name: "Save" }).click();
    });

    // Edit and cancel
    await test.step("Edit and cancel", async () => {
      await page
        .locator(".flex.flex-col.sm\\:flex-row")
        .nth(0)
        .locator("button:has(svg.lucide-square-pen)")
        .click();

      await expect(
        page.getByRole("heading", { name: "Add/Edit Interpretation" }),
      ).toBeVisible();

      // Make changes

      await page
        .locator(
          'input[name="qualified_ranges.0.ranges.0.interpretation.display"]',
        )
        .fill("Changed Value");

      // Cancel
      await page.getByRole("button", { name: "Cancel" }).click();

      // Verify sheet closes
      await expect(
        page.getByRole("heading", { name: "Add/Edit Interpretation" }),
      ).not.toBeVisible();

      // Verify original values are preserved (should still show "Normal" in summary)
      await expect(
        page.getByText("Observation Interpretation (1)"),
      ).toBeVisible();
    });

    // Submit form
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText("observation definition created successfully"),
    ).toBeVisible({ timeout: 10000 });
  });
});
