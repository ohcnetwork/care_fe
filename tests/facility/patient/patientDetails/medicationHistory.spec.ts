import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Medication History tab in the patient details page.
 * Covers rendering, tab switching, and empty state for each tab.
 *
 * Run with: npx playwright test tests/facility/patient/patientDetails/medicationHistory.spec.ts
 */

test.describe("Patient Medication History", () => {
  test.use({ storageState: "../../../../.auth/user.json" });

  test("renders Medication History tabs and switches between them", async ({ page }) => {
    // Navigate to a patient details page with a known patientId (fixture or test patient)
    // This patientId should exist in the test DB snapshot
    await page.goto("/facility/1/patient/1");
    await expect(page.getByRole("tab", { name: /prescriptions/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /medication statements/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /medicine administration/i })).toBeVisible();

    // Switch to Medication Statements tab
    await page.getByRole("tab", { name: /medication statements/i }).click();
    await expect(page.getByRole("tabpanel")).toContainText(/timeline|no medication statements/i);

    // Switch to Medicine Administration tab
    await page.getByRole("tab", { name: /medicine administration/i }).click();
    await expect(page.getByRole("tabpanel")).toContainText(/timeline|no medicine administration/i);
  });

  test("shows empty state if no medications exist", async ({ page }) => {
    // Use a patientId with no medications (fixture or test patient)
    await page.goto("/facility/1/patient/2");
    await expect(page.getByText(/no medications|no prescriptions|no medication statements|no medicine administration/i)).toBeVisible();
  });
});
