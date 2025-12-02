import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Form Submission from Encounter and Display in Overview", () => {
  /**
   * Helper function to create a test questionnaire for encounter
   */
  async function createTestQuestionnaire(page: Page) {
    const slug = faker.string.alphanumeric({ length: 10 });
    const name = `Test Encounter Form ${slug}`;

    await page.goto("/");
    await page.getByRole("link", { name: "Admin Dashboard" }).click();
    await page.getByRole("button", { name: "Create Questionnaire" }).click();
    await page.getByRole("button", { name: "Import" }).click();
    await page
      .locator("[data-slot='dropdown-menu-item']")
      .getByText("Import from URL")
      .click();

    // Import a questionnaire with various question types
    await page
      .getByPlaceholder("https://example.com/questionnaire.json")
      .fill(
        "https://raw.githubusercontent.com/nihal467/questionnaire/refs/heads/main/All%20Structure%20Question.json",
      );
    await page.locator("[data-slot='button']").getByText("Import").click();
    await page.getByRole("button", { name: "Import Form" }).click();

    await page
      .locator("[data-slot='card-title']")
      .getByText("Properties")
      .scrollIntoViewIfNeeded();

    // Set as active encounter questionnaire
    await page.locator("#status-active").click();
    await page.locator("#subject-type-encounter").click();

    await page.locator("input[name='title']").fill(name);
    await page.locator("input[name='slug']").fill(slug);

    // Add to Admin organization
    await page
      .getByRole("button", { name: "Select Organizations" })
      .first()
      .click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill("Admin");
    await page.locator("[cmdk-item]").getByText("Admin").first().click();
    await page.keyboard.press("Escape");

    await page.locator("button[type='submit']").click();

    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire created successfully"),
    ).toBeVisible({ timeout: 10000 });

    return { name, slug };
  }

  test("should submit form from encounter page and verify it appears in overview", async ({
    page,
  }) => {
    // Create a test questionnaire first
    const questionnaire = await createTestQuestionnaire(page);

    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters list
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Click on first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Wait for the encounter page to load
    await page.waitForURL(/\/encounter\/[^/]+\/overview/);

    // Extract encounter ID and patient ID from URL
    const url = page.url();
    const encounterId = url.match(/\/encounter\/([^/]+)/)?.[1];
    const patientId = url.match(/\/patient\/([^/]+)/)?.[1];

    expect(encounterId).toBeTruthy();
    expect(patientId).toBeTruthy();

    // Scroll to Forms section in the overview
    const formsSection = page.getByText("Forms").first();
    await formsSection.scrollIntoViewIfNeeded();

    // Click on the form selector to add a form
    const formSelector = page
      .getByRole("combobox")
      .filter({ hasText: /choose form|select forms/i })
      .first();

    await formSelector.scrollIntoViewIfNeeded();
    await formSelector.click();

    // Wait for the command input to appear
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });

    // Search for our created questionnaire
    await page.locator("[cmdk-input]").fill(questionnaire.name);

    // Wait for search results
    await page.waitForTimeout(1000);

    // Click on our questionnaire
    const formOption = page.getByRole("option", { name: questionnaire.name });
    await expect(formOption).toBeVisible({ timeout: 5000 });
    await formOption.click();

    // Wait for navigation to the questionnaire form page
    await page.waitForURL(/\/questionnaire\//, { timeout: 10000 });

    // Wait for the form to load
    await page.waitForTimeout(2000);

    // Generate test data for form fields
    const testTextValue = `Test text ${faker.lorem.words(3)}`;
    const testNumberValue = faker.number.int({ min: 1, max: 100 });

    // Track the values we enter for verification later
    const enteredValues: Record<string, string> = {};

    // Fill available form fields
    // Look for text inputs (excluding readonly/disabled)
    const textInputs = page.locator(
      'input[type="text"]:not([readonly]):not([disabled])',
    );
    const textInputCount = await textInputs.count();

    if (textInputCount > 0) {
      const firstInput = textInputs.first();
      await firstInput.scrollIntoViewIfNeeded();
      await firstInput.fill(testTextValue);
      enteredValues["text_field"] = testTextValue;
    }

    // Look for number inputs
    const numberInputs = page.locator(
      'input[type="number"]:not([readonly]):not([disabled])',
    );
    const numberInputCount = await numberInputs.count();

    if (numberInputCount > 0) {
      const firstNumberInput = numberInputs.first();
      await firstNumberInput.scrollIntoViewIfNeeded();
      await firstNumberInput.fill(testNumberValue.toString());
      enteredValues["number_field"] = testNumberValue.toString();
    }

    // Look for textarea fields
    const textareas = page.locator("textarea:not([readonly]):not([disabled])");
    const textareaCount = await textareas.count();

    if (textareaCount > 0) {
      const firstTextarea = textareas.first();
      await firstTextarea.scrollIntoViewIfNeeded();
      await firstTextarea.fill(testTextValue);
      enteredValues["textarea_field"] = testTextValue;
    }

    // Submit the form
    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();

    // Wait for success toast
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire submitted successfully"),
    ).toBeVisible({ timeout: 15000 });

    // Wait for navigation to updates page after submission
    await page.waitForURL(/\/encounter\/[^/]+\/updates/, { timeout: 10000 });

    // Navigate to the overview tab to verify the form appears
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/overview`,
    );

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Scroll to the questionnaire responses section
    // The QuestionnaireResponsesList should show our submitted form
    const questionnaireHeading = page.getByRole("heading", {
      name: /forms|questionnaire responses/i,
    });

    if (
      await questionnaireHeading.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await questionnaireHeading.scrollIntoViewIfNeeded();
    }

    // Verify the form title appears in the overview
    const formTitleInOverview = page.getByText(questionnaire.name).first();
    await expect(formTitleInOverview).toBeVisible({ timeout: 10000 });

    // Verify that the entered values appear in the overview
    let valueFound = false;
    for (const [label, value] of Object.entries(enteredValues)) {
      const valueInOverview = page.getByText(value, { exact: false });
      if (
        await valueInOverview
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        valueFound = true;
        console.log(
          `✓ Found value "${value}" for field "${label}" in overview`,
        );
      }
    }

    // At least one value should be visible
    expect(valueFound).toBeTruthy();

    console.log("✓ Form submission and display verification completed");
  });
});
