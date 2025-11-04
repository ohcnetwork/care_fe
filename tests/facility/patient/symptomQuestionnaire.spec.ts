import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const SYMPTOM_CLINICAL_STATUS = [
  "Active",
  "Recurrence",
  "Relapse",
  "Inactive",
  "Remission",
  "Resolved",
] as const;

const SYMPTOM_SEVERITY = ["Mild", "Moderate", "Severe"] as const;

const SYMPTOM_VERIFICATION_STATUS = [
  "Unconfirmed",
  "Provisional",
  "Differential",
  "Confirmed",
  "Refuted",
] as const;

const SYMPTOM_REMOVE_STATUS = "Entered in Error";

async function addSymptomWithRandomFields(page: any) {
  // Open symptom selector
  await page
    .getByRole("combobox")
    .filter({ hasText: /Add (another )?Symptom/i })
    .click();

  // Wait for symptom options to load
  await page.getByRole("option").first().waitFor({ state: "visible" });

  // Get all available symptom options
  const symptomOptions = await page.getByRole("option").all();

  const availableOptions = await Promise.all(
    symptomOptions.map(async (option: any, index: number) => ({
      element: option,
      text: (await option.textContent()) || "",
      index,
    })),
  );
  // Select random from unused options
  const randomOption = faker.helpers.arrayElement(availableOptions);
  const symptomText = randomOption.text;
  await randomOption.element.click();

  // Wait for the NEW row to appear (not the disabled ones)
  await page.waitForLoadState("networkidle");

  // Find the EDITABLE row (has enabled combobox)
  const symptomRow = page
    .getByRole("row", { name: new RegExp(symptomText) })
    .filter({ has: page.locator('button[role="combobox"]:not([disabled])') });

  // Select random clinical status (nth(2) - Status column)
  await symptomRow.getByRole("cell").nth(2).click();
  const randomStatus = faker.helpers.arrayElement([...SYMPTOM_CLINICAL_STATUS]);
  await page.getByRole("option", { name: randomStatus, exact: true }).click();

  // Select random severity status (nth(3) - Severity column)
  await symptomRow.getByRole("cell").nth(3).click();
  const randomSeverity = faker.helpers.arrayElement([...SYMPTOM_SEVERITY]);
  await page.getByRole("option", { name: randomSeverity, exact: true }).click();

  // Select random verification status (nth(4) - Verification column)
  await symptomRow.getByRole("cell").nth(4).click();
  const randomVerification = faker.helpers.arrayElement([
    ...SYMPTOM_VERIFICATION_STATUS,
  ]);
  await page
    .getByRole("option", { name: randomVerification, exact: true })
    .click();

  return { symptomText, randomStatus, randomSeverity, randomVerification };
}

test.describe("Symptom Questionnaire", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let questionnaireUrl: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/symptom`;

    await page.goto(questionnaireUrl);
  });

  test("should add symptom with all fields", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await addSymptomWithRandomFields(page);
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Symptoms/ })).toBeVisible();
  });

  test("should add symptom and verify it appears in symptom history", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    const { symptomText } = await addSymptomWithRandomFields(page);

    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("networkidle");

    // Go back to symptom questionnaire and open history
    await page.goto(questionnaireUrl);
    await page.getByRole("button", { name: "Symptom History" }).click();

    const historyDialog = page.getByRole("dialog", { name: "Past Symptoms" });
    await historyDialog.waitFor({ state: "visible" });

    // Verify the symptom appears in history
    const tableBody = historyDialog.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(symptomText);
  });

  test("should remove a symptom from questionnaire", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const { symptomText } = await addSymptomWithRandomFields(page);
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("networkidle");

    // Navigate back and remove
    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");
    const rowToRemove = page
      .getByRole("row", { name: new RegExp(symptomText) })
      .filter({ has: page.locator('button[role="combobox"]:not([disabled])') });
    await rowToRemove.getByRole("button").nth(1).click();
    await page.getByRole("menuitem", { name: "Remove Symptom" }).click();
    await page.waitForLoadState("networkidle");
    const verificationCell = rowToRemove.getByRole("cell").nth(4);
    await expect(verificationCell).toContainText(SYMPTOM_REMOVE_STATUS);

    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("networkidle");

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    const submittedRow = page
      .getByRole("row", { name: new RegExp(symptomText) })
      .filter({ hasText: SYMPTOM_REMOVE_STATUS });
    await expect(submittedRow).toBeVisible();
  });
});
