import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Appointment Booking Sheet UI.
 * Covers opening the sheet, switching tabs, and basic appointment slot visibility.
 * Assumes authenticated user and a patient/facility exist in test DB.
 */
test.describe("Appointment Booking Sheet", () => {
  test.use({ storageState: "../.auth/user.json" });

  test("should open the booking sheet and show appointment tab by default", async ({ page }) => {
    // Navigate to a patient page with appointment booking
    await page.goto("/facility/1/patient/1");
    // Open the booking sheet (assume button with text 'Book Appointment' exists)
    await page.getByRole("button", { name: /book appointment/i }).click();
    // Sheet should be visible
    await expect(page.getByRole("dialog", { name: /book appointment/i })).toBeVisible();
    // Appointment tab should be active
    await expect(page.getByRole("tab", { name: /book appointment/i, selected: true })).toBeVisible();
    // Bookings tab should be present
    await expect(page.getByRole("tab", { name: /bookings/i })).toBeVisible();
  });

  test("should switch to bookings tab and show bookings list", async ({ page }) => {
    await page.goto("/facility/1/patient/1");
    await page.getByRole("button", { name: /book appointment/i }).click();
    await page.getByRole("tab", { name: /bookings/i }).click();
    // Bookings list should be visible (tab content)
    await expect(page.getByRole("tabpanel")).toContainText(/upcoming|past|cancelled/i);
  });

  test("should show available slots or empty state in slot picker", async ({ page }) => {
    await page.goto("/facility/1/patient/1");
    await page.getByRole("button", { name: /book appointment/i }).click();
    // Should show slot picker or empty state
    const slotPicker = page.getByText(/available time slots|no slots available/i);
    await expect(slotPicker).toBeVisible();
  });
});
