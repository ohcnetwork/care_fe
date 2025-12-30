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

const symptomOptions = [
  "Chronic pain",
  "Chronic respiratory failure due to obstructive sleep apnoea",
  "Chronic nontraumatic intracranial subdural haematoma",
  "Adenosine deaminase 2 deficiency",
  "Malignant melanoma of skin of left wrist",
  "Small bowel enteroscopy normal",
  "Renal scarring due to vesicoureteral reflux",
  "Venous ulcer of toe of left foot",
  "Acquired arteriovenous malformation of vascular structure of gastrointestinal tract",
  "Venous ulcer of left ankle",
  "Acute left-sided ulcerative colitis",
  "Allergy to hydrogen peroxide",
];
const usedSymptoms = new Set<string>(); // To track used symptoms across tests so we don't add duplicate symptoms

test.describe("Symptom Questionnaire", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let questionnaireUrl: string;
  let symptomName: string;
  let status: string;
  let verification: string;
  let severity: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();

    const availableSymptomOptions = symptomOptions.filter(
      (d) => !usedSymptoms.has(d),
    );
    symptomName = faker.helpers.arrayElement(availableSymptomOptions);
    usedSymptoms.add(symptomName); //Add to used symptoms to avoid duplicates

    status = faker.helpers.arrayElement(SYMPTOM_CLINICAL_STATUS);
    verification = faker.helpers.arrayElement(SYMPTOM_VERIFICATION_STATUS);
    severity = faker.helpers.arrayElement(SYMPTOM_SEVERITY);

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/symptom`;

    await page.goto(questionnaireUrl);
  });

  test("should add symptom with all fields", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Symptom/i })
      .click();
    await page.getByPlaceholder(/Add (another )?Symptom/i).fill(symptomName);
    await page.getByRole("option", { name: symptomName, exact: true }).click();
    const symptomRow = page.getByRole("row", { name: symptomName });

    await symptomRow.getByRole("cell").nth(2).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    await symptomRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity, exact: true }).click();

    await symptomRow.getByRole("cell").nth(4).click();
    await page.getByRole("option", { name: verification, exact: true }).click();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.getByRole("button", { name: "Symptom History" }).click();

    const symptomHistoryDialog = page.getByRole("dialog", {
      name: "Past Symptoms",
    });
    await symptomHistoryDialog.waitFor({ state: "visible" });

    const tableBody = symptomHistoryDialog.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(symptomName);

    const symptomHistoryRow = symptomHistoryDialog
      .locator('[data-slot="table-body"] tr')
      .filter({ hasText: symptomName });

    await expect(symptomHistoryRow).toContainText(status);
    await expect(symptomHistoryRow).toContainText(severity);
    await expect(symptomHistoryRow).toContainText(verification);
  });

  test("verify duplicate symptom cannot be added", async ({ page }) => {
    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Symptom/i })
      .click();
    await page.getByPlaceholder(/Add (another )?Symptom/i).fill(symptomName);
    await page.getByRole("option", { name: symptomName, exact: true }).click();
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    const duplicateSymptomName = faker.helpers.arrayElement([...usedSymptoms]);

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Symptom/i })
      .click();
    await page
      .getByRole("option")
      .filter({ hasText: duplicateSymptomName })
      .click();

    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Symptom already exists!" }),
    ).toBeVisible();
  });
});
