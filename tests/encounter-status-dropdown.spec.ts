import { expect, test } from "@playwright/test";

// TODO: Enable once API mocking is implemented
// Required setup:
// - Mock encounterApi.get to return encounters with different statuses
// - Provide valid test facility, patient, and encounter IDs
// - Add beforeEach setup for test data
test.describe.skip("Encounter Status Dropdown Logic", () => {
  const FACILITY_ID = "test-facility-id";
  const PATIENT_ID = "test-patient-id";

  test.describe("Active encounter", () => {
    const ACTIVE_ENCOUNTER_ID = "active-encounter-id";

    test("should NOT show DISCHARGED & UNKNOWN in dropdown", async ({
      page,
    }) => {
      await page.goto(
        `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ACTIVE_ENCOUNTER_ID}/updates`,
      );
      await page.click('[data-testid="encounter-status-select"]');
      const optionValues = await page.$$eval(
        '[data-testid="status-option"]',
        (opts) => opts.map((o) => o.getAttribute("data-value")),
      );
      expect(optionValues).not.toContain("discharged");
      expect(optionValues).not.toContain("unknown");
    });
  });

  test.describe("Discharged encounter", () => {
    const DISCHARGED_ENCOUNTER_ID = "discharged-encounter-id";

    test("should have dropdown disabled", async ({ page }) => {
      await page.goto(
        `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${DISCHARGED_ENCOUNTER_ID}/updates`,
      );
      const trigger = page.locator('[data-testid="encounter-status-select"]');
      await expect(trigger).toBeDisabled();
    });

    test("should display DISCHARGED status text", async ({ page }) => {
      await page.goto(
        `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${DISCHARGED_ENCOUNTER_ID}/updates`,
      );
      const statusText = await page.textContent(
        '[data-testid="encounter-status"]',
      );
      expect(statusText?.toLowerCase()).toContain("discharged");
    });
  });
});
