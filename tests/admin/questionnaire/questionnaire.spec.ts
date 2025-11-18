import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire Status Management", () => {
  const questionnaireName = "Respiratory Support";
  let questionnaireUrl: string;

  // Helper function to navigate to questionnaire admin page
  async function navigateToQuestionnaireAdmin(page: Page) {
    await page.goto("/");
    await page.getByRole("link", { name: "Admin Dashboard" }).click();

    // Search for the questionnaire
    await page
      .getByPlaceholder(/search/i)
      .filter({ hasText: "" })
      .first()
      .fill(questionnaireName);

    // Wait for search results to load by checking if view button appears
    await page.getByRole("button", { name: /view/i }).first().waitFor();

    // Click the first questionnaire view button
    await page.getByRole("button", { name: /view/i }).first().click();

    return page.url();
  }

  // Helper function to update questionnaire status
  async function updateQuestionnaireStatus(
    page: Page,
    status: "retired" | "draft" | "active",
  ) {
    await page.goto(questionnaireUrl);
    await page.locator(`#status-${status}`).click();

    // Save the questionnaire
    await page.getByRole("button", { name: /save/i }).click();

    // Wait for success notification
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire updated successfully"),
    ).toBeVisible({ timeout: 10000 });
  }

  // Helper function to try adding questionnaire to encounter
  async function tryAddingQuestionnaire(
    page: Page,
    shouldBeAvailable: boolean,
  ) {
    // Click the add questionnaire button (combobox with role)
    await page
      .getByRole("combobox")
      .filter({ hasText: /add form/i })
      .click();

    // Wait for the combobox to be visible and type the questionnaire name
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(questionnaireName);

    if (shouldBeAvailable) {
      // Wait for and verify the questionnaire option is available
      await expect(
        page.getByRole("option", { name: questionnaireName }).first(),
      ).toBeVisible();
      await page
        .getByRole("option", { name: questionnaireName })
        .first()
        .click();
    } else {
      // Verify "No Results Found" message appears
      await expect(
        page.locator("[cmdk-empty]").getByText("No Results Found"),
      ).toBeVisible();

      // Close the combobox
      await page.keyboard.press("Escape");
    }
  }

  // Setup: Navigate to questionnaire admin and save URL
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    questionnaireUrl = await navigateToQuestionnaireAdmin(page);
    await context.close();
  });

  test("retired questionnaire should not be available in encounter", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate directly to encounters with filters applied
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in-progress`,
    );

    // Open the first encounter details
    await page.getByText("View Encounter").first().click();

    // Click Update Encounter link
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Update questionnaire status to retired
    await updateQuestionnaireStatus(page, "retired");

    // Go back to encounter and verify questionnaire is not available
    await page.goBack();
    await page.goBack();
    await tryAddingQuestionnaire(page, false);
  });

  test("draft questionnaire should not be available in encounter", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate directly to encounters with filters applied
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in-progress`,
    );

    // Open the first encounter details
    await page.getByText("View Encounter").first().click();

    // Click Update Encounter link
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Update questionnaire status to draft
    await updateQuestionnaireStatus(page, "draft");

    // Go back to encounter and verify questionnaire is not available
    await page.goBack();
    await page.goBack();
    await tryAddingQuestionnaire(page, false);
  });

  test("active questionnaire should be available in encounter", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate directly to encounters with filters applied
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in-progress`,
    );

    // Open the first encounter details
    await page.getByText("View Encounter").first().click();

    // Click Update Encounter link
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Update questionnaire status to active
    await updateQuestionnaireStatus(page, "active");

    // Go back to encounter and verify questionnaire is available
    await page.goBack();
    await page.goBack();
    await tryAddingQuestionnaire(page, true);
  });
});
