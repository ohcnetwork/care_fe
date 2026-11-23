import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import {
  CLINICAL_STATUS_OPTIONS,
  type EncounterTarget,
  SEVERITY_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
  addDiagnosisViaUi,
  selectDiagnosis,
} from "tests/helper/structuredQuestions";
import { firstValueSetDisplay } from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Diagnosis", () => {
  let encounter: EncounterTarget;
  let diagnosisName: string;
  let questionnaireUrl: string;
  let status: string;
  let verification: string;
  let severity: string;

  test.beforeEach(async () => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    encounter = { facilityId, patientId, encounterId };
    diagnosisName = await firstValueSetDisplay(
      "system-condition-code",
      facilityId,
    );

    status = faker.helpers.arrayElement(CLINICAL_STATUS_OPTIONS);
    verification = faker.helpers.arrayElement(VERIFICATION_STATUS_OPTIONS);
    severity = faker.helpers.arrayElement(SEVERITY_OPTIONS);

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/diagnosis`;
  });

  test(
    "should add diagnosis with all fields and verify it appears in diagnosis history",
    { tag: ["@atomic", "@cap:questionnaire.structured.diagnosis.create"] },
    async ({ page }) => {
      await addDiagnosisViaUi(page, {
        ...encounter,
        diagnosisName,
        clinicalStatus: status,
        severity,
        verificationStatus: verification,
      });

      await page.goto(questionnaireUrl);
      await page.getByRole("button", { name: "Diagnosis History" }).click();

      const historyDialog = page.getByRole("dialog", {
        name: "Past Diagnoses",
      });
      await historyDialog.waitFor({ state: "visible" });

      // Each date group renders its OWN <tbody data-slot="table-body">
      // (HistoricalRecordSelector/index.tsx) — a locator over that selector
      // alone strict-mode-violates the moment records span more than one
      // day. Target the specific row for the diagnosis JUST added instead.
      const diagnosisHistoryRow = historyDialog
        .locator("tr")
        .filter({ hasText: diagnosisName })
        .filter({ hasText: status });

      await expect(diagnosisHistoryRow.first()).toBeVisible();
      await expect(diagnosisHistoryRow.first()).toContainText(diagnosisName);
      await expect(diagnosisHistoryRow.first()).toContainText(status);
      await expect(diagnosisHistoryRow.first()).toContainText(severity);
      await expect(diagnosisHistoryRow.first()).toContainText(verification);
    },
  );

  test(
    "verify duplicate diagnosis cannot be added",
    { tag: ["@atomic", "@cap:questionnaire.structured.diagnosis.create"] },
    async ({ page }) => {
      await addDiagnosisViaUi(page, { ...encounter, diagnosisName });

      await page.goto(questionnaireUrl);
      await page.waitForLoadState("networkidle");

      await selectDiagnosis(page, diagnosisName);

      await expect(
        page
          .getByRole("region", { name: "Notifications alt+T" })
          .getByRole("listitem")
          .filter({ hasText: "Diagnosis already exists" }),
      ).toBeVisible();
    },
  );

  test(
    "add and display diagnosis with severity",
    { tag: ["@atomic", "@cap:questionnaire.structured.diagnosis.create"] },
    async ({ page }) => {
      await addDiagnosisViaUi(page, {
        ...encounter,
        diagnosisName,
        severity: "Severe",
      });

      const diagnosisSummary = page
        .getByRole("region", { name: "Diagnoses", exact: true })
        .getByRole("listitem")
        .filter({ has: page.getByText(diagnosisName, { exact: true }) });
      await expect(diagnosisSummary).toBeVisible();
      await expect(
        diagnosisSummary.getByText("Severe", { exact: true }),
      ).toBeVisible();
      await expect(diagnosisSummary.getByText(/^Onset\b/)).toBeVisible();

      await page.goto(questionnaireUrl);
      await page.getByRole("button", { name: "Diagnosis History" }).click();
      const historyRow = page
        .getByRole("dialog", { name: "Past Diagnoses" })
        .getByRole("row")
        .filter({ has: page.getByText(diagnosisName, { exact: true }) });
      await expect(
        historyRow.getByText("Severe", { exact: true }),
      ).toBeVisible();
      await expect(
        historyRow.getByText("Confirmed", { exact: true }),
      ).toBeVisible();
    },
  );
});
