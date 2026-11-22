import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { firstValueSetDisplay } from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });
let diagnosisName: string;
let questionnaireUrl: string;
let status: string;
let verification: string;
let severity: string;

const DIAGNOSIS_CLINICAL_STATUS = [
  "Active",
  "Recurrence",
  "Relapse",
  "Inactive",
  "Remission",
  "Resolved",
];

const DIAGNOSIS_VERIFICATION_STATUS = [
  "Unconfirmed",
  "Provisional",
  "Differential",
  "Confirmed",
  "Refuted",
];

const DIAGNOSIS_SEVERITY = ["Mild", "Moderate", "Severe"];

async function addDiagnosis(page: Page, severity?: string) {
  await page
    .getByRole("combobox")
    .filter({ hasText: /Add (another )?Diagnosis/i })
    .click();
  await page.getByPlaceholder(/Add (another )?Diagnosis/i).fill(diagnosisName);
  await page
    .getByTestId("valueset-search-results")
    .getByRole("option", { name: diagnosisName, exact: true })
    .click();

  const diagnosisRow = page.getByRole("row", { name: diagnosisName });

  if (severity) {
    await diagnosisRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
  }
}

test.describe("Diagnosis", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    diagnosisName = await firstValueSetDisplay(
      "system-condition-code",
      facilityId,
    );

    status = faker.helpers.arrayElement(DIAGNOSIS_CLINICAL_STATUS);
    verification = faker.helpers.arrayElement(DIAGNOSIS_VERIFICATION_STATUS);
    severity = faker.helpers.arrayElement(DIAGNOSIS_SEVERITY);

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/diagnosis`;
    await page.goto(questionnaireUrl);
  });

  test("should add diagnosis with all fields and verify it appears in diagnosis history", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    await addDiagnosis(page);

    const diagnosisRow = page.getByRole("row", { name: diagnosisName });

    await diagnosisRow.getByRole("cell").nth(2).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    await diagnosisRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity, exact: true }).click();

    await diagnosisRow.getByRole("cell").nth(4).click();
    await page.getByRole("option", { name: verification, exact: true }).click();
    await expect(diagnosisRow.getByRole("cell").nth(4)).toContainText(
      verification,
    );

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.getByRole("button", { name: "Diagnosis History" }).click();

    const historyDialog = page.getByRole("dialog", { name: "Past Diagnoses" });
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
  });

  test("verify duplicate diagnosis cannot be added", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    await addDiagnosis(page);
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    await addDiagnosis(page);

    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Diagnosis already exists" }),
    ).toBeVisible();
  });

  test("add and display diagnosis with severity", async ({ page }) => {
    await addDiagnosis(page, "severe");

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
    await expect(historyRow.getByText("Severe", { exact: true })).toBeVisible();
    await expect(
      historyRow.getByText("Confirmed", { exact: true }),
    ).toBeVisible();
  });
});
