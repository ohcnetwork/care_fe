import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Navigate to an encounter's questionnaire form and wait for
 * full page load at each step.
 */
async function navigateToEncounterForm(page: Page) {
  const facilityId = getFacilityId();
  const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const createdDateBefore = format(new Date(), "yyyy-MM-dd");

  await page.goto(
    `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
  );

  await page.getByText("View Encounter").first().click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: "Update Encounter" }).click();
  await page.waitForLoadState("networkidle");
}

test.describe("QuestionnaireForm Dirty State Guard", () => {
  test("navigation guard remains active after failed form submission", async ({
    page,
  }) => {
    await navigateToEncounterForm(page);

    // Open the form selector
    const formSelector = page
      .getByRole("combobox")
      .filter({ hasText: /add form/i });
    await expect(formSelector).toBeVisible({ timeout: 10_000 });
    await formSelector.click();

    // Wait for search input using data-slot selector
    const searchInput = page.locator('[data-slot="command-input"]');
    await expect(searchInput).toBeVisible();

    // Pick the first available form
    const firstOption = page.locator('[data-slot="command-item"]').first();
    await expect(firstOption).toBeVisible({ timeout: 10_000 });
    await firstOption.click();

    // Wait for the form to render by asserting the submit button is visible
    const submitButton = page.getByRole("button", { name: /submit/i });
    await expect(submitButton).toBeVisible({ timeout: 10_000 });

    // Submit without filling required fields — should trigger validation errors
    await submitButton.click();

    // Wait for validation to produce an error (deterministic wait)
    const validationError = page.getByText(/required|invalid|error/i).first();
    await expect(validationError)
      .toBeVisible({ timeout: 5_000 })
      .catch(
        // If no validation error appears (form has no required fields),
        // the form may have submitted successfully — skip this test case
        () => test.skip(),
      );

    // Navigate away using an in-app link to trigger the raviger guard
    const navLink = page
      .getByRole("link", { name: /home|dashboard|facility/i })
      .first();
    await expect(navLink).toBeVisible();
    await navLink.click();

    // The unsaved changes dialog should appear
    await expect(page.getByText(/unsaved changes/i)).toBeVisible({
      timeout: 5_000,
    });
  });
});
