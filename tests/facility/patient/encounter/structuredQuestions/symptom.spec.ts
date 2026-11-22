import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { firstValueSetDisplay } from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

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

async function selectSymptom(page: Page, name: string) {
  await page
    .getByRole("combobox")
    .filter({ hasText: /Add (another )?Symptom/i })
    .click();
  await page.getByPlaceholder(/Add (another )?Symptom/i).fill(name);
  await page
    .getByTestId("valueset-search-results")
    .getByRole("option", { name, exact: true })
    .click();
}

test.describe("Symptom Questionnaire", () => {
  let questionnaireUrl: string;
  let symptomName: string;
  let status: string;
  let verification: string;
  let severity: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    symptomName = await firstValueSetDisplay("system-symptom-code", facilityId);

    status = faker.helpers.arrayElement(SYMPTOM_CLINICAL_STATUS);
    verification = faker.helpers.arrayElement(SYMPTOM_VERIFICATION_STATUS);
    severity = faker.helpers.arrayElement(SYMPTOM_SEVERITY);

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/symptom`;

    await page.goto(questionnaireUrl);
  });

  test("should add symptom with all fields", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    await selectSymptom(page, symptomName);
    const symptomRow = page.getByRole("row", { name: symptomName });

    await symptomRow.getByRole("cell").nth(2).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    await symptomRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity, exact: true }).click();

    await symptomRow.getByRole("cell").nth(4).click();
    await page.getByRole("option", { name: verification, exact: true }).click();

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

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
  });

  test("verify duplicate symptom cannot be added", async ({ page }) => {
    await selectSymptom(page, symptomName);
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    await selectSymptom(page, symptomName);

    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Symptom already exists!" }),
    ).toBeVisible();
  });
});
