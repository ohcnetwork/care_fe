import { expect, test } from "@playwright/test";
import { getEncounterId } from "./support/encounterId";
import { getFacilityId } from "./support/facilityId";
import { getPatientId } from "./support/patientId";

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

  test.describe("Transition to discharged", () => {
    test("should lock dropdown after discharge", async ({ page }) => {
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
      );

      // Verify initial state
      await expect(page.getByTestId("encounter-status-select")).toBeEnabled();

      // Click "Mark for Discharge"
      await page.getByTestId("mark-as-discharged").click();

      // Handle Critical Verification Dialog
      const confirmInput = page.getByRole("textbox", {
        name: /type "Discharge Patient" to confirm/i,
      });
      if (await confirmInput.isVisible()) {
        await confirmInput.fill("Discharge Patient");
      } else {
        await page.getByLabel(/type.*to confirm/i).fill("Discharge Patient");
      }

      await page.getByRole("button", { name: "Proceed" }).click();

      // Verify dropdown is locked
      await expect(page.getByTestId("encounter-status-select")).toBeDisabled();

      // Verify output shows Discharged
      await expect(page.getByTestId("encounter-status")).toHaveText(
        "Discharged",
      );
    });
  });
});
