import { test, expect } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// This test suite covers the Patient Home page, which displays patient info, tabs for encounters, appointments, and tokens.
test.use({ storageState: "tests/.auth/user.json" });

test.describe("PatientHome page", () => {
  test("should show skeletons while loading and error alert for missing params", async ({ page }) => {
    const facilityId = getFacilityId();
    // Visit PatientHome without required params
    await page.goto(`/facility/${facilityId}/patients/home`);
    // Should show skeletons (loading state)
    await expect(page.locator(".md\\:max-w-5xl .space-y-4")).toBeVisible();
    // Should show error alert for missing params
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/missing required params/i)).toBeVisible();
  });

  test("should render patient info and encounters tab after verification", async ({ page }) => {
    const facilityId = getFacilityId();
    // Use a valid patient fixture (assume patientId 1 exists in test DB)
    const yearOfBirth = "1990";
    const partialId = "1";
    await page.goto(`/facility/${facilityId}/patients/home?year_of_birth=${yearOfBirth}&partial_id=${partialId}`);
    // Wait for patient info card
    await expect(page.getByTestId("patient-info-card")).toBeVisible();
    // Tabs should be visible
    await expect(page.getByRole("button", { name: /encounters/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /appointments/i })).toBeVisible();
    // Encounters timeline or empty state should be visible
    await expect(page.locator("[data-testid^='timeline-encounter-card'], .empty-state")).toBeVisible();
  });

  test("should switch tabs and show tokens list if permitted", async ({ page }) => {
    const facilityId = getFacilityId();
    const yearOfBirth = "1990";
    const partialId = "1";
    await page.goto(`/facility/${facilityId}/patients/home?year_of_birth=${yearOfBirth}&partial_id=${partialId}`);
    // Switch to tokens tab
    await page.getByRole("button", { name: /tokens/i }).click();
    // PatientTokensList should be visible
    await expect(page.getByTestId("patient-tokens-list")).toBeVisible();
  });
});
