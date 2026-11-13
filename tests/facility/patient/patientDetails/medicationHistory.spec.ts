import { test, expect } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

/**
 * MedicationHistory E2E tests
 * Covers tab navigation and basic rendering for prescriptions, statements, and administration tabs.
 */
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient MedicationHistory page", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
  });

  test("renders all medication history tabs and default prescriptions table", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/patient/${patientId}/history/medications`);
    // Tabs
    await expect(page.getByRole("tab", { name: /prescriptions/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /medication statements/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /medicine administration/i })).toBeVisible();
    // Default tab content
    await expect(page.getByText(/past medications/i)).toBeVisible();
    await expect(page.getByRole("tab", { selected: true })).toHaveText(/prescriptions/i);
    // Table or empty state
    await expect(
      page.locator("[data-testid^=medications-table], [data-testid^=empty-state]")
    ).toBeVisible();
  });

  test("switches to medication statements tab", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/patient/${patientId}/history/medications`);
    await page.getByRole("tab", { name: /medication statements/i }).click();
    await expect(page.getByRole("tab", { selected: true })).toHaveText(/medication statements/i);
    // Timeline or empty state
    await expect(
      page.locator("[data-testid^=medication-statement-list], [data-testid^=empty-state]")
    ).toBeVisible();
  });

  test("switches to medicine administration tab", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/patient/${patientId}/history/medications`);
    await page.getByRole("tab", { name: /medicine administration/i }).click();
    await expect(page.getByRole("tab", { selected: true })).toHaveText(/medicine administration/i);
    // Timeline or empty state
    await expect(
      page.locator("[data-testid^=administration-tab], [data-testid^=empty-state]")
    ).toBeVisible();
  });
});
