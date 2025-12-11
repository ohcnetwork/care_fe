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
  const ENCOUNTER_ID = "test-encounter-id";

  test("Active encounter should NOT show DISCHARGED & UNKNOWN in dropdown", async ({
    page,
  }) => {
    // This test needs comprehensive mocking to work
    await page.goto(
      `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}/updates`,
    );
    await page.click('[data-testid="status-dropdown"]');
    const options = await page.$$eval('[data-testid="status-option"]', (opts) =>
      opts.map((o) => o.textContent?.trim().toLowerCase()),
    );
    expect(options).not.toContain("discharged");
    expect(options).not.toContain("unknown");
  });

  test("Discharged encounter should have dropdown disabled", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}/updates`,
    );
    const dropdown = page.locator('[data-testid="status-dropdown"]');
    await expect(dropdown).toBeDisabled();
  });

  test("DISCHARGED status text visible when encounter is discharged", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}/updates`,
    );
    const statusText = await page.textContent(
      '[data-testid="encounter-status"]',
    );
    expect(statusText).toBe("discharged");
  });

  test("Active encounter dropdown should not include DISCHARGED option", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}/updates`,
    );
    await page.click('[data-testid="status-dropdown"]');
    const options = await page.$$eval('[data-testid="status-option"]', (opts) =>
      opts.map((o) => o.textContent?.trim().toLowerCase()),
    );
    expect(options).not.toContain("discharged");
  });
});
