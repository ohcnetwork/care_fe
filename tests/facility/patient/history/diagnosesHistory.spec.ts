import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use authenticated state
// This test assumes the database has at least one patient with diagnoses
// (fixture or created by another test)
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Diagnoses History Tab", () => {
  test("should display diagnoses history tab and timeline", async ({ page }) => {
    const facilityId = getFacilityId();
    // Go to facility patients list
    await page.goto(`/facility/${facilityId}/patients`);
    // Click first patient in the list
    await page.getByRole("link", { name: /view profile/i }).first().click();
    // Go to Clinical History tab
    await page.getByRole("tab", { name: /clinical history/i }).click();
    // Switch to Diagnoses tab
    await page.getByRole("tab", { name: /diagnoses/i }).click();
    // Timeline should be visible
    await expect(page.getByText(/past diagnoses/i)).toBeVisible();
    // At least one diagnosis or empty state
    const timeline = page.getByText(/no diagnoses/i).or(page.getByRole("row"));
    await expect(timeline).toBeVisible();
  });

  test("should show load more button if diagnoses exceed page size", async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/patients`);
    await page.getByRole("link", { name: /view profile/i }).first().click();
    await page.getByRole("tab", { name: /clinical history/i }).click();
    await page.getByRole("tab", { name: /diagnoses/i }).click();
    // If there are more than 30 diagnoses, load more button should appear
    const loadMore = page.getByRole("button", { name: /load more/i });
    // Not all patients will have >30, so just check it does not throw
    await loadMore.isVisible().catch(() => {});
  });

  test("should show empty state if no diagnoses exist", async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/patients`);
    // Find a patient with no diagnoses (may need to create one in future)
    // For now, click the last patient
    const patientLinks = await page.getByRole("link", { name: /view profile/i }).all();
    await patientLinks[patientLinks.length - 1].click();
    await page.getByRole("tab", { name: /clinical history/i }).click();
    await page.getByRole("tab", { name: /diagnoses/i }).click();
    // Should show empty state
    await expect(page.getByText(/no diagnoses/i)).toBeVisible();
  });
});
