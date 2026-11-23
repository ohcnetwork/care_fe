import { expect, test, type Page } from "@playwright/test";
import { navigateInApp } from "tests/helper/history";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

function sidebar(page: Page) {
  return page.locator('[data-sidebar="sidebar"]');
}

test.describe("Questionnaire fill and print routes", () => {
  test(
    "fill pages hide the sidebar and print pages keep it",
    { tag: ["@atomic", "@cap:nav.layout.view"] },
    async ({ page }) => {
      const patientUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}`;
      const encounterUrl = `${patientUrl}/encounter/${getEncounterId()}`;
      const questionnaireId = "patient_feedback";

      for (const base of [encounterUrl, patientUrl]) {
        const fillUrl = `${base}/questionnaire/${questionnaireId}`;

        await page.goto(patientUrl);
        await expect(sidebar(page).first()).toBeVisible();
        await navigateInApp(page, fillUrl);
        await expect(page).toHaveURL(new RegExp(`${fillUrl}$`));
        await expect(sidebar(page)).toHaveCount(0);

        await page.goto(`${fillUrl}/responses/print`);
        await expect(sidebar(page).first()).toBeVisible();
      }
    },
  );
});
