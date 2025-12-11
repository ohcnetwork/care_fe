import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Status Dropdown Logic", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
  });

  test.describe("Active encounter", () => {
    test("should NOT show DISCHARGED & UNKNOWN in dropdown", async ({
      page,
    }) => {
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
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
});
