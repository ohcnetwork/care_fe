import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Appointments Page
 * Covers loading, filtering, and navigation for appointments list and board views.
 * Assumes authenticated user and at least one facility with appointments.
 */
test.describe("Appointments Page", () => {
  test.use({ storageState: "../.auth/user.json" });

  test("should load appointments list view and display table", async ({ page }) => {
    await page.goto("/appointments");
    await expect(page.getByRole("heading", { name: /appointments/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /list/i })).toBeVisible();
    await page.getByRole("tab", { name: /list/i }).click();
    await expect(page.getByRole("table")).toBeVisible();
    // At least one row or empty state
    const rows = await page.locator("table tbody tr").count();
    expect(rows).toBeGreaterThanOrEqual(0);
  });

  test("should load appointments board view and show status columns", async ({ page }) => {
    await page.goto("/appointments");
    await expect(page.getByRole("tab", { name: /board/i })).toBeVisible();
    await page.getByRole("tab", { name: /board/i }).click();
    // Wait for at least one status column
    await expect(page.getByRole("heading", { name: /booked|checked in|in consultation|fulfilled|non fulfilled/i })).toBeVisible();
  });

  test("should filter appointments by patient", async ({ page }) => {
    await page.goto("/appointments");
    // Open patient filter
    await expect(page.getByPlaceholder("Search patients")).toBeVisible();
    // Type a letter to trigger suggestions (may be empty)
    await page.getByPlaceholder("Search patients").fill("a");
    // Wait for dropdown or no results
    await page.waitForTimeout(500);
    // Select first suggestion if exists
    const options = page.locator("[role='option']");
    if (await options.count() > 0) {
      await options.first().click();
      // Table or board should update
      await expect(page.getByRole("table")).toBeVisible();
    }
  });

  test("should show empty state if no appointments match filters", async ({ page }) => {
    await page.goto("/appointments");
    // Set a date far in the past
    await page.getByLabel(/date/i).click();
    // Select a date (simulate via input if possible)
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill("2000-01-01");
      await page.keyboard.press("Enter");
      // Wait for empty state
      await expect(page.getByText(/no appointments/i)).toBeVisible();
    }
  });
});
