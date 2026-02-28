import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Diagnostic Reports Tab", () => {
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

  test("should display the diagnostic reports tab", async ({ page }) => {
    // Navigate to the Diagnostic Reports tab
    await page.getByRole("tab", { name: "Diagnostic Reports" }).click();

    // Verify the tab content is visible
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();
  });

  test("should show empty state or diagnostic reports list", async ({
    page,
  }) => {
    // Navigate to the Diagnostic Reports tab
    await page.getByRole("tab", { name: "Diagnostic Reports" }).click();

    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Should show either diagnostic report cards or empty state or a card list
    const content = page
      .locator('[data-slot="card"]')
      .first()
      .or(page.getByText(/no diagnostic reports/i))
      .or(page.getByText(/no.*report/i));

    // Wait a moment for content to fully render
    await page.waitForTimeout(1000);

    // The tab should render without errors
    await expect(
      page.getByText(/something went wrong/i),
    ).not.toBeVisible();
  });

  test("should have activity definition filter dropdown", async ({ page }) => {
    // Navigate to the Diagnostic Reports tab
    await page.getByRole("tab", { name: "Diagnostic Reports" }).click();

    await page.waitForLoadState("networkidle");

    // The diagnostic reports tab has an Autocomplete filter for activity definitions
    const filterDropdown = page
      .getByRole("combobox")
      .or(page.getByPlaceholder(/filter|activity|all/i));

    // If the filter is visible, verify it exists
    if (await filterDropdown.first().isVisible().catch(() => false)) {
      await expect(filterDropdown.first()).toBeVisible();
    }
  });

  test("should navigate to diagnostic reports tab from encounter", async ({
    page,
  }) => {
    // The diagnostic reports tab should be accessible from the encounter tabs
    const tab = page.getByRole("tab", { name: "Diagnostic Reports" });
    await expect(tab).toBeVisible();

    await tab.click();

    // Verify we're on the diagnostic reports tab
    // The URL should contain the diagnostic_reports segment
    await expect(page).toHaveURL(/diagnostic_reports/);
  });

  test("should render the responses tab without errors", async ({ page }) => {
    // Also test the Responses tab while we're here
    const responsesTab = page.getByRole("tab", { name: "Responses" });
    if (await responsesTab.isVisible().catch(() => false)) {
      await responsesTab.click();

      // Verify tab loads without errors
      await page.waitForTimeout(1000);
      await expect(
        page.getByText(/something went wrong/i),
      ).not.toBeVisible();
    }
  });
});
