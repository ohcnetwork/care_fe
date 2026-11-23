import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import {
  CLINICAL_STATUS_OPTIONS,
  type EncounterTarget,
  SEVERITY_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
  addSymptomViaUi,
  selectSymptom,
} from "tests/helper/structuredQuestions";
import { firstValueSetDisplay } from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Symptom Questionnaire", () => {
  let encounter: EncounterTarget;
  let questionnaireUrl: string;
  let symptomName: string;
  let status: string;
  let verification: string;
  let severity: string;

  test.beforeEach(async () => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    encounter = { facilityId, patientId, encounterId };
    symptomName = await firstValueSetDisplay("system-symptom-code", facilityId);

    status = faker.helpers.arrayElement(CLINICAL_STATUS_OPTIONS);
    verification = faker.helpers.arrayElement(VERIFICATION_STATUS_OPTIONS);
    severity = faker.helpers.arrayElement(SEVERITY_OPTIONS);

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/symptom`;
  });

  test(
    "should add symptom with all fields",
    { tag: ["@atomic", "@cap:questionnaire.structured.symptom.create"] },
    async ({ page }) => {
      await addSymptomViaUi(page, {
        ...encounter,
        symptomName,
        clinicalStatus: status,
        severity,
        verificationStatus: verification,
      });

      await page.goto(questionnaireUrl);
      await page.getByRole("button", { name: "Symptom History" }).click();

      const symptomHistoryDialog = page.getByRole("dialog", {
        name: "Past Symptoms",
      });
      await symptomHistoryDialog.waitFor({ state: "visible" });

      // Each date group renders its OWN <tbody data-slot="table-body">
      // (HistoricalRecordSelector/index.tsx) — a locator over that selector
      // alone strict-mode-violates the moment records span more than one
      // day. Target the specific row for the symptom JUST added instead.
      const symptomHistoryRow = symptomHistoryDialog
        .locator("tr")
        .filter({ hasText: symptomName })
        .filter({ hasText: status });

      await expect(symptomHistoryRow.first()).toBeVisible();
      await expect(symptomHistoryRow.first()).toContainText(symptomName);
      await expect(symptomHistoryRow.first()).toContainText(status);
      await expect(symptomHistoryRow.first()).toContainText(severity);
      await expect(symptomHistoryRow.first()).toContainText(verification);
    },
  );

  test(
    "verify duplicate symptom cannot be added",
    { tag: ["@atomic", "@cap:questionnaire.structured.symptom.create"] },
    async ({ page }) => {
      await addSymptomViaUi(page, { ...encounter, symptomName });

      await page.goto(questionnaireUrl);
      await page.waitForLoadState("networkidle");

      await selectSymptom(page, symptomName);

      await expect(
        page
          .getByRole("region", { name: "Notifications alt+T" })
          .getByRole("listitem")
          .filter({ hasText: "Symptom already exists!" }),
      ).toBeVisible();
    },
  );
});
