import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });
let facilityId: string;
let patientId: string;
let encounterId: string;
let diagnosisName: string;
let questionnaireUrl: string;
let status: string;
let verification: string;
let severity: string;
const usedDiagnoses = new Set<string>(); // To track used diagnoses across tests so we don't add duplicate diagnoses

const diagnosisOptions = [
  "Chronic nontraumatic intracranial subdural haematoma",
  "Malignant melanoma of skin of left wrist",
  "Born in Nauru",
  "Chronic respiratory failure due to obstructive sleep apnoea",
  "Difficulty controlling anger",
  "Lack of trust",
  "Acquired arteriovenous malformation of vascular structure of gastrointestinal tract",
  "Venous ulcer of left ankle",
  "Feeling angry",
  "Fetal heart sounds quiet",
  "Small bowel enteroscopy normal",
  "Ear smelly",
  "Cholera",
  "Osteonecrosis",
  "Chronic pain",
];

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
  await page.getByRole("option", { name: diagnosisName, exact: true }).click();

  const diagnosisRow = page.getByRole("row", { name: diagnosisName });

  if (severity) {
    await diagnosisRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity }).click();
    await page.getByRole("button", { name: "Submit" }).click();
  }
}

test.describe("Diagnosis", () => {
  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();

    const availableDiagnosesOptions = diagnosisOptions.filter(
      (d) => !usedDiagnoses.has(d),
    );
    diagnosisName = faker.helpers.arrayElement(availableDiagnosesOptions);
    usedDiagnoses.add(diagnosisName);

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

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.getByRole("button", { name: "Diagnosis History" }).click();

    const historyDialog = page.getByRole("dialog", { name: "Past Diagnoses" });
    await historyDialog.waitFor({ state: "visible" });

    const tableBody = historyDialog.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(diagnosisName);

    const diagnosisHistoryRow = historyDialog
      .locator('[data-slot="table-body"] tr')
      .filter({ hasText: diagnosisName });

    await expect(diagnosisHistoryRow).toContainText(status);
    await expect(diagnosisHistoryRow).toContainText(severity);
    await expect(diagnosisHistoryRow).toContainText(verification);
  });

  test("verify duplicate diagnosis cannot be added", async ({ page }) => {
    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Diagnosis/i })
      .click();
    await page
      .getByPlaceholder(/Add (another )?Diagnosis/i)
      .fill(diagnosisName);
    await page
      .getByRole("option", { name: diagnosisName, exact: true })
      .click();
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    const duplicateDiagnosisName = faker.helpers.arrayElement([
      ...usedDiagnoses,
    ]);

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Diagnosis/i })
      .click();
    await page
      .getByPlaceholder(/Add (another )?Diagnosis/i)
      .fill(duplicateDiagnosisName);
    await page
      .getByRole("option", { name: duplicateDiagnosisName, exact: true })
      .click();

    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Diagnosis already exists" }),
    ).toBeVisible();
  });

  test("add and display diagnosis with severity", async ({ page }) => {
    await addDiagnosis(page, "severe");

    expect(
      page
        .locator("div")
        .filter({ hasText: /^DiagnosisStatusSeverityVerificationOnset/ })
        .nth(1),
    ).toBeVisible();
    const diagnosisRow = page
      .locator("div")
      .filter({ hasText: /^DiagnosisStatusSeverityVerificationOnset/ })
      .nth(1);
    await expect(diagnosisRow.getByText("Status")).toBeVisible();
    await expect(diagnosisRow.getByText("Severity")).toBeVisible();
    await expect(diagnosisRow.getByText("Verification")).toBeVisible();
    await expect(diagnosisRow.getByText("Onset")).toBeVisible();

    await expect(diagnosisRow.getByText(diagnosisName)).toBeVisible();
  });
});
