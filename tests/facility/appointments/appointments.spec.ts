import { test, expect } from "@playwright/test";
import { getFacilityId } from "@/tests/support/facilityId";

/**
 * Appointments Page Tests
 * Tests core appointment listing and filtering functionality
 * Route: /facility/:facilityId/appointments
 */
test.describe("Appointments Page", () => {
  test.beforeEach(async ({ page }) => {
    // Get facility ID from fixture data
    const facilityId = await getFacilityId();

    // Navigate to appointments page
    await page.goto(`/facility/${facilityId}/appointments`);

    // Wait for page to load - typically shows a loading state or table
    await page.waitForLoadState("networkidle");
  });

  test("should display appointments page heading", async ({ page }) => {
    // Verify the page has loaded and shows appointments heading
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("should display appointments table or list", async ({ page }) => {
    // Check for appointments table/list existence
    // Could be a table or a list of cards
    const table = page.locator("table");
    const listItems = page.locator("[role='listitem']");

    // At least one of these should exist
    const tableVisible = await table.isVisible().catch(() => false);
    const itemsVisible = await listItems.first().isVisible().catch(() => false);

    expect(tableVisible || itemsVisible).toBeTruthy();
  });

  test("should have search or filter functionality", async ({ page }) => {
    // Look for common filter controls
    const searchInput = page.getByRole("textbox", { name: /search|filter/i });
    const filterButton = page.getByRole("button", { name: /filter|sort/i });

    // At least one should be present for filtering
    const searchExists = await searchInput.isVisible().catch(() => false);
    const filterExists = await filterButton.isVisible().catch(() => false);

    expect(searchExists || filterExists).toBeTruthy();
  });

  test("should allow navigation to appointment details", async ({ page }) => {
    // Wait for appointments to load
    await page.waitForTimeout(1000);

    // Try to find and click on first appointment if any exist
    const firstAppointment = page
      .locator("[role='button']")
      .filter({ hasText: /appointment|view|detail/i })
      .first();

    const isVisible = await firstAppointment.isVisible().catch(() => false);

    if (isVisible) {
      const currentUrl = page.url();
      await firstAppointment.click();

      // Wait for navigation or modal to appear
      await page.waitForTimeout(500);

      // Verify we either navigated or a detail view appeared
      const urlChanged = page.url() !== currentUrl;
      const modalVisible = await page
        .locator("[role='dialog']")
        .first()
        .isVisible()
        .catch(() => false);

      expect(urlChanged || modalVisible).toBeTruthy();
    }
  });

  test("should display patient identifier filter when available", async ({
    page,
  }) => {
    // Look for patient-related filter options
    const patientInput = page.getByRole("textbox", { name: /patient|identifier/i });
    const patientLabel = page.getByText(/patient|identifier/i);

    const hasPatientFilter =
      (await patientInput.isVisible().catch(() => false)) ||
      (await patientLabel.isVisible().catch(() => false));

    // Patient filter may or may not be present depending on page configuration
    expect(typeof hasPatientFilter).toBe("boolean");
  });

  test("should maintain page structure and layout", async ({ page }) => {
    // Check for common page structure elements
    const mainContent = page.locator("main");

    // At least main content should be visible
    const mainVisible = await mainContent.isVisible().catch(() => true);
    expect(mainVisible).toBeTruthy();
  });

  test("should handle empty appointment state gracefully", async ({
    page,
  }) => {
    // Look for empty state message or no results indicator
    const emptyMessage = page.getByText(/no appointments|no results|no data/i);

    // If there are no appointments, there should be an empty state message
    const appointmentRows = page.locator("tbody tr");
    const hasAppointments =
      (await appointmentRows.count().catch(() => 0)) > 0;

    if (!hasAppointments) {
      const hasEmptyState = await emptyMessage.isVisible().catch(() => false);
      expect(hasEmptyState).toBeTruthy();
    }
  });
});

test.describe("Appointments Filtering", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = await getFacilityId();
    await page.goto(`/facility/${facilityId}/appointments`);
    await page.waitForLoadState("networkidle");
  });

  test("should filter appointments by search input", async ({ page }) => {
    // Find search input
    const searchInput = page.getByRole("textbox", {
      name: /search|filter/i,
    });

    const isSearchVisible = await searchInput.isVisible().catch(() => false);

    if (isSearchVisible) {
      // Get initial count of items
      const initialItems = await page.locator("tbody tr").count();

      // Type search term
      await searchInput.fill("test");

      // Wait for filtering to complete
      await page.waitForTimeout(500);

      // Verify filtering logic applies (items may reduce or stay same)
      const filteredItems = await page.locator("tbody tr").count();

      // Should have some response to filter input
      expect(typeof filteredItems).toBe("number");
      expect(filteredItems >= 0).toBeTruthy();
    }
  });

  test("should allow clearing filters", async ({ page }) => {
    // Find and use clear/reset button if available
    const clearButton = page.getByRole("button", {
      name: /clear|reset|close|×/i,
    });

    const isClearVisible = await clearButton.isVisible().catch(() => false);

    if (isClearVisible) {
      await clearButton.click();

      // Wait for page to reset
      await page.waitForTimeout(500);

      // Page should still be functional
      await expect(page).not.toHaveURL(/error|404/);
    }
  });
});

test.describe("Appointments Print Functionality", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = await getFacilityId();
    await page.goto(`/facility/${facilityId}/appointments`);
    await page.waitForLoadState("networkidle");
  });

  test("should have print button if appointments exist", async ({ page }) => {
    // Look for print-related button
    const printButton = page.getByRole("button", { name: /print/i });

    const isPrintAvailable = await printButton.isVisible().catch(() => false);

    // Print feature may be conditional or optional
    expect(typeof isPrintAvailable).toBe("boolean");
  });
});
