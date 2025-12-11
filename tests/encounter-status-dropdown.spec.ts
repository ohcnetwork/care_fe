import { expect, test } from "@playwright/test";

/**
 * These tests are skipped because they require comprehensive API mocking.
 * The EncounterQuestion component (with the status dropdown) is inside a
 * questionnaire form that requires auth, facility, patient, encounter,
 * organizations, and questionnaire API mocks to render properly.
 *
 * TODO: Set up comprehensive API mocking or test with a running backend.
 */
test.describe.skip("Encounter Status Dropdown Logic", () => {
  const FACILITY_ID = "test-facility-id";
  const PATIENT_ID = "test-patient-id";

  test.describe("Active encounter", () => {
    const ACTIVE_ENCOUNTER_ID = "active-encounter-id";
    // TODO: Mock encounter API to return status !== "discharged"

    test("should NOT show DISCHARGED & UNKNOWN in dropdown", async ({
      page,
    }) => {
      await page.goto(
        `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ACTIVE_ENCOUNTER_ID}/updates`,
      );
      await page.click('[data-testid="status-dropdown"]');
      // Use case-insensitive contains matching for translated text
      const options = await page.$$eval(
        '[data-testid="status-option"]',
        (opts) => opts.map((o) => o.textContent?.trim().toLowerCase()),
      );
      expect(options.some((o) => o?.includes("discharged"))).toBe(false);
      expect(options.some((o) => o?.includes("unknown"))).toBe(false);
    });
  });

  test.describe("Discharged encounter", () => {
    const DISCHARGED_ENCOUNTER_ID = "discharged-encounter-id";
    // TODO: Mock encounter API to return status === "discharged"

    test("should have dropdown disabled", async ({ page }) => {
      await page.goto(
        `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${DISCHARGED_ENCOUNTER_ID}/updates`,
      );
      const dropdown = page.locator('[data-testid="status-dropdown"]');
      await expect(dropdown).toBeDisabled();
    });

    test("should display DISCHARGED status text", async ({ page }) => {
      await page.goto(
        `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${DISCHARGED_ENCOUNTER_ID}/updates`,
      );
      const statusText = await page.textContent(
        '[data-testid="encounter-status"]',
      );
      // Use case-insensitive matching for translated text
      expect(statusText?.toLowerCase()).toContain("discharged");
    });
  });
});
