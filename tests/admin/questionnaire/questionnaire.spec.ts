import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire Status Management", () => {
  test("verify questionnaire status functionality in encounter", async ({
    page,
  }) => {
    const questionnaireName = "Respiratory Support";
    let patientEncounterUrl: string;
    let questionnaireUrl: string;

    // Step 1: Navigate to homepage
    await page.goto("/");

    // Step 2: Navigate to a facility and open an in-progress encounter
    // Click on the first facility
    await page
      .getByRole("link", { name: "View facility details" })
      .first()
      .click();

    // Close the sidebar rail if open
    await page.locator("[data-sidebar='rail']").click();
    await page.waitForTimeout(1000);

    // Navigate to Patients > All Encounters
    await page
      .locator('[data-sidebar="menu"]')
      .getByText("Patients", { exact: true })
      .click();
    await page
      .locator('[data-sidebar="menu"]')
      .getByText("All Encounters")
      .click();

    // Filter for In Progress encounters
    await page.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("menuitem", { name: "Status" }).click();
    await page.getByText("In Progress", { exact: true }).click();
    // Close the filter menu by pressing Escape
    await page.keyboard.press("Escape");

    // Wait for filtered results to load
    await page.waitForTimeout(1000);

    // Open the first encounter details
    await page
      .locator('[data-cy="encounter-list-cards"]')
      .first()
      .getByText("View Encounter")
      .click();

    // Click Update Encounter link
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Save the encounter URL for later use
    patientEncounterUrl = page.url();

    // Step 3: Add the questionnaire to the encounter
    // Click the add questionnaire button
    await page.locator('[data-cy="add-questionnaire-button"]').click();

    // Wait for the combobox to be visible and type the questionnaire name
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(questionnaireName);

    // Wait a moment for the search to complete
    await page.waitForTimeout(500);

    // Select the questionnaire from the dropdown
    await page.getByRole("option", { name: questionnaireName }).first().click();

    // Step 4: Navigate to Admin Dashboard to manage questionnaire
    await page.goto("/");

    // Click Admin Dashboard
    await page
      .locator('[data-cy="admin-dashboard-button"]')
      .getByText("Admin Dashboard")
      .click();

    // Search for the questionnaire
    await page
      .locator('[data-cy="questionnaire-search"]')
      .fill(questionnaireName);

    // Wait for search results
    await page.waitForTimeout(500);

    // Click the first questionnaire view button
    await page.locator('[data-cy="questionnaire-view"]').first().click();

    // Save the questionnaire URL for later use
    questionnaireUrl = page.url();

    // Step 5: Update questionnaire status to retired
    await page.locator("#status-retired").click();

    // Save the questionnaire
    await page
      .locator('[data-cy="save-questionnaire-form"]')
      .getByText("Save")
      .click();

    // Verify the questionnaire was updated successfully
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire updated successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Step 6: Verify questionnaire is not visible in encounter when retired
    await page.goto(patientEncounterUrl);

    // Try to add questionnaire and verify it's not available
    await page.locator('[data-cy="add-questionnaire-button"]').click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(questionnaireName);
    await page.waitForTimeout(500);

    // Verify "No Results Found" message appears
    await expect(
      page.locator("[cmdk-empty]").getByText("No Results Found"),
    ).toBeVisible();

    // Close the combobox
    await page.keyboard.press("Escape");

    // Step 7: Update questionnaire status to draft
    await page.goto(questionnaireUrl);

    await page.locator("#status-draft").click();

    // Save the questionnaire
    await page
      .locator('[data-cy="save-questionnaire-form"]')
      .getByText("Save")
      .click();

    // Verify the questionnaire was updated successfully
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire updated successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Step 8: Verify questionnaire is not visible in encounter when in draft
    await page.goto(patientEncounterUrl);

    // Try to add questionnaire and verify it's not available
    await page.locator('[data-cy="add-questionnaire-button"]').click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(questionnaireName);
    await page.waitForTimeout(500);

    // Verify "No Results Found" message appears
    await expect(
      page.locator("[cmdk-empty]").getByText("No Results Found"),
    ).toBeVisible();

    // Close the combobox
    await page.keyboard.press("Escape");

    // Step 9: Update questionnaire status to active
    await page.goto(questionnaireUrl);

    await page.locator("#status-active").click();

    // Save the questionnaire
    await page
      .locator('[data-cy="save-questionnaire-form"]')
      .getByText("Save")
      .click();

    // Verify the questionnaire was updated successfully
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire updated successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Step 10: Verify questionnaire is visible and can be added to encounter when active
    await page.goto(patientEncounterUrl);

    // Add the questionnaire to the encounter again
    await page.locator('[data-cy="add-questionnaire-button"]').click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(questionnaireName);
    await page.waitForTimeout(500);

    // Verify the questionnaire is available and select it
    await expect(
      page.getByRole("option", { name: questionnaireName }).first(),
    ).toBeVisible();
    await page.getByRole("option", { name: questionnaireName }).first().click();
  });
});
