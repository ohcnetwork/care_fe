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

      // Verify initial state: dropdown should be enabled
      await expect(page.getByTestId("encounter-status-select")).toBeEnabled();

      // Mock the discharge request to avoid persisting state changes to the backend
      await page.route(`**/api/v1/encounter/${encounterId}/`, async (route) => {
        if (
          route.request().method() === "PATCH" ||
          route.request().method() === "PUT"
        ) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: encounterId,
              status: "discharged",
              encounter_class: "imp",
              period: { start: new Date().toISOString() },
              hospitalization: {
                discharge_disposition: "home",
              },
              patient: { id: patientId },
              facility: { id: facilityId },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Trigger the discharge flow
      await page.getByTestId("mark-as-discharged").click();

      // Handle the confirmation dialog
      const confirmInput = page.getByRole("textbox", {
        name: /type "Discharge Patient" to confirm/i,
      });
      await expect(confirmInput).toBeVisible();
      await confirmInput.fill("Discharge Patient");

      await page.getByRole("button", { name: "Proceed" }).click();

      // Verify dropdown is locked
      await expect(page.getByTestId("encounter-status-select")).toBeDisabled();

      // Verify dropdown shows Discharged
      await expect(page.getByTestId("encounter-status-select")).toHaveText(
        "Discharged",
      );
    });
  });
});
