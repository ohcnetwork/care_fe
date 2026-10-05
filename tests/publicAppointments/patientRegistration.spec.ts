import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Public Patient Registration page (public appointment booking flow).
 * Covers: form rendering, validation, successful submission, and navigation.
 *
 * Run with:
 *   npx playwright test tests/publicAppointments/patientRegistration.spec.ts
 */

test.describe("Public Patient Registration", () => {
  test("should render all required fields and submit with valid data", async ({ page }) => {
    // Simulate navigation to the patient registration page with slotId and staffId
    await page.goto("/facility/1/appointments/1/patient-registration?slotId=1");

    // All required fields should be visible
    await expect(page.getByLabel(/patient name/i)).toBeVisible();
    await expect(page.getByLabel(/sex/i)).toBeVisible();
    await expect(page.getByLabel(/date of birth/i)).toBeVisible();
    await expect(page.getByLabel(/current address/i)).toBeVisible();
    await expect(page.getByLabel(/pincode/i)).toBeVisible();
    await expect(page.getByLabel(/organization/i)).toBeVisible();

    // Fill the form with valid data
    await page.getByLabel(/patient name/i).fill("Test Patient");
    await page.getByLabel(/sex/i).getByText(/male/i).click();
    await page.getByLabel(/date of birth/i).fill("2000-01-01");
    await page.getByLabel(/current address/i).fill("123 Main St");
    await page.getByLabel(/pincode/i).fill("123456");
    await page.getByLabel(/organization/i).fill("Test Org");

    // Submit the form
    await page.getByRole("button", { name: /register patient/i }).click();

    // Success toast or navigation to success page
    await expect(page).toHaveURL(/success/);
  });

  test("should show validation errors for empty required fields", async ({ page }) => {
    await page.goto("/facility/1/appointments/1/patient-registration?slotId=1");
    await page.getByRole("button", { name: /register patient/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test("should allow switching between age and date of birth input", async ({ page }) => {
    await page.goto("/facility/1/appointments/1/patient-registration?slotId=1");
    // Switch to age input
    await page.getByLabel(/date of birth or age/i).getByText(/age/i).click();
    await expect(page.getByLabel(/age/i)).toBeVisible();
    // Switch back to date of birth
    await page.getByLabel(/date of birth or age/i).getByText(/date of birth/i).click();
    await expect(page.getByLabel(/date of birth/i)).toBeVisible();
  });
});
