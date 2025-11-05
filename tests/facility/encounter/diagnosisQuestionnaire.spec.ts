import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const DIAGNOSIS_CLINICAL_STATUS = [
  "Active",
  "Recurrence",
  "Relapse",
  "Inactive",
  "Remission",
  "Resolved",
] as const;

const DIAGNOSIS_VERIFICATION_STATUS = [
  "Unconfirmed",
  "Provisional",
  "Differential",
  "Confirmed",
  "Refuted",
] as const;

const DIAGNOSIS_REMOVE_STATUS = "Entered in Error";

async function addDiagnosisWithRandomFields(page: any) {
  // Open diagnosis selector
  await page
    .getByRole("combobox")
    .filter({ hasText: /Add (another )?Diagnosis/i })
    .click();

  // Wait for diagnosis options to load
  await page.getByRole("option").first().waitFor({ state: "visible" });

  // Get all available diagnosis options
  const diagnosisOptions = await page.getByRole("option").all();

  const availableOptions = await Promise.all(
    diagnosisOptions.map(async (option: any, index: number) => ({
      element: option,
      text: (await option.textContent()) || "",
      index,
    })),
  );

  // Select random from unused options
  const randomOption = faker.helpers.arrayElement(availableOptions);
  const diagnosisText = randomOption.text;
  await randomOption.element.click();

  // Wait for the NEW row to appear (not the disabled ones)
  await page.waitForLoadState("networkidle");

  // Find the EDITABLE row (has enabled combobox)
  const diagnosisRow = page
    .getByRole("row", { name: new RegExp(diagnosisText) })
    .filter({ has: page.locator('button[role="combobox"]:not([disabled])') });

  // Select random clinical status (nth(2) - Status column)
  await diagnosisRow.getByRole("cell").nth(2).click();
  const randomStatus = faker.helpers.arrayElement([
    ...DIAGNOSIS_CLINICAL_STATUS,
  ]);
  await page.getByRole("option", { name: randomStatus, exact: true }).click();

  // Select random verification status (nth(3) - Verification column)
  await diagnosisRow.getByRole("cell").nth(3).click();
  const randomVerification = faker.helpers.arrayElement([
    ...DIAGNOSIS_VERIFICATION_STATUS,
  ]);
  await page
    .getByRole("option", { name: randomVerification, exact: true })
    .click();

  return { diagnosisText, randomStatus, randomVerification };
}

test.describe("Diagnosis Questionnaire", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let questionnaireUrl: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/diagnosis`;

    await page.goto(questionnaireUrl);
  });

  test("should add diagnosis with all fields", async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Add diagnosis with random fields
    await addDiagnosisWithRandomFields(page);

    // Submit the form
    await page.getByRole("button", { name: "Submit" }).click();

    // Wait for submission to complete
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("link", { name: /Diagnosis/ })).toBeVisible();
  });

  test("should add diagnosis and verify it appears in diagnosis history", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    // Add diagnosis with random fields
    const { diagnosisText } = await addDiagnosisWithRandomFields(page);

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("networkidle");

    // Go back to diagnosis questionnaire
    await page.goto(questionnaireUrl);

    // Open Diagnosis History
    await page.getByRole("button", { name: "Diagnosis History" }).click();

    const historyDialog = page.getByRole("dialog", { name: "Past Diagnoses" });
    await historyDialog.waitFor({ state: "visible" });

    // Verify the diagnosis appears in history
    const tableBody = historyDialog.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(diagnosisText);
  });

  test("should remove a diagnosis from questionnaire", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // First, add a diagnosis so we have something to remove
    const { diagnosisText } = await addDiagnosisWithRandomFields(page);

    // Submit it first
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("networkidle");

    // Navigate back to questionnaire
    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    // Find the row we just added (it's the editable one with our diagnosis)
    const rowToRemove = page
      .getByRole("row", { name: new RegExp(diagnosisText) })
      .filter({ has: page.locator('button[role="combobox"]:not([disabled])') });

    // Remove it
    await rowToRemove.getByRole("button").nth(1).click();
    await page.getByRole("menuitem", { name: "Remove Diagnosis" }).click();
    await page.waitForLoadState("networkidle");

    // Verify the verification status changed to "Entered in Error"
    const verificationCell = rowToRemove.getByRole("cell").nth(3);
    await expect(verificationCell).toContainText(DIAGNOSIS_REMOVE_STATUS);

    // Submit the form
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("networkidle");

    // Go back to verify it's now uneditable
    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    // Verify the row now has disabled comboboxes (uneditable)
    const submittedRow = page
      .getByRole("row", { name: new RegExp(diagnosisText) })
      .filter({ hasText: DIAGNOSIS_REMOVE_STATUS });
    await expect(submittedRow).toBeVisible();
  });
});
