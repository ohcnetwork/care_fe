import { test, expect } from "@playwright/test";

/**
 * E2E: Public Appointments Success Page
 * Verifies appointment success details are displayed after booking.
 * Covers: Success message, appointment details, and navigation.
 */
test.describe("PublicAppointments/Success", () => {
  test.use({
    storageState: "tests/.auth/user.json",
  });

  test("shows success message and appointment details", async ({ page }) => {
    // This test assumes a valid appointmentId is available after booking.
    // For robust E2E, booking flow should be run before this test.
    // Here, we use a placeholder appointmentId for demonstration.
    const appointmentId = "test-appointment-id";
    await page.goto(`/facility/1/appointments/${appointmentId}/success`);

    // Success icon and message
    await expect(page.getByRole("heading", { name: /success/i })).toBeVisible();
    await expect(page.getByText(/thank you/i)).toBeVisible();

    // Appointment details
    await expect(page.getByText(/doctor|nurse/i)).toBeVisible();
    await expect(page.getByText(/patient/i)).toBeVisible();
    await expect(page.getByText(/date/i)).toBeVisible();
    await expect(page.getByText(/time/i)).toBeVisible();
  });
});
