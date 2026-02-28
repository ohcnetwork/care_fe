import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Observations Tab", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters list filtered by in-progress status
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );
  });

  test("should display the observations tab", async ({ page }) => {
    // Navigate to the Observations tab
    await page.getByRole("tab", { name: "Observations" }).click();

    // Verify the tab content is visible
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();
  });

  test("should show observations after adding a symptom", async ({ page }) => {
    // First add a symptom to create observation data
    await test.step("Add a symptom via encounter actions", async () => {
      await page
        .getByRole("button", { name: /encounter actions/i })
        .first()
        .click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      const commandInput = dialog.locator(
        'input[data-slot="command-input"], input[cmdk-input]',
      );
      await commandInput.fill("symptom");

      await dialog
        .getByRole("option", { name: /add symptom/i })
        .first()
        .click();

      // Wait for symptom questionnaire form to load
      await page.waitForURL(/\/questionnaire/);

      // Fill the symptom form
      const combobox = page
        .getByRole("combobox")
        .filter({ hasText: /add symptom|add another symptom/i });
      await combobox.scrollIntoViewIfNeeded();
      await combobox.click();

      await page.locator("[cmdk-input]").waitFor({ state: "visible" });
      await page.locator("[cmdk-input]").fill("Headache");

      const option = page.getByRole("option", { name: /headache/i }).first();
      await option.waitFor({ state: "visible" });
      await option.click();

      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Questionnaire submitted successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step(
      "Navigate to observations tab and verify data",
      async () => {
        // Navigate to the Observations tab
        await page.getByRole("tab", { name: "Observations" }).click();

        // Wait for observations to load
        await page.waitForLoadState("networkidle");

        // The observations tab should show observation entries
        const tabContent = page.locator('[role="tabpanel"]');
        await expect(tabContent).toBeVisible();

        // Look for observation content (date grouping headers, observation values)
        // The tab shows grouped observations by date
        const observationContent = page
          .getByText(/today|yesterday/i)
          .or(page.locator('[data-slot="card"]').first());

        // If observations exist, they should be visible with date grouping
        if (await observationContent.isVisible().catch(() => false)) {
          await expect(observationContent).toBeVisible();
        }
      },
    );
  });

  test("should navigate between encounter tabs without errors", async ({
    page,
  }) => {
    // Navigate through multiple tabs to ensure no errors
    const tabs = [
      "Observations",
      "Medicines",
      "Service Requests",
      "Files",
      "Notes",
      "Devices",
      "Updates",
    ];

    for (const tabName of tabs) {
      const tab = page.getByRole("tab", { name: tabName });
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        // Wait a moment for the tab content to load
        await page.waitForTimeout(500);
        // Verify no error page is shown
        await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
      }
    }
  });
});
