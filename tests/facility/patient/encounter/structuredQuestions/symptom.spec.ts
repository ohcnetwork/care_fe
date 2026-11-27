import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { valueSetColumn } from "tests/helper/ui";
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
  await valueSetColumn(page.locator("body"), "search")
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

    // The form seeds its rows from this encounter's saved symptoms; wait for
    // that list so every test edits a fully loaded form.
    const savedSymptoms = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === `/api/v1/patient/${patientId}/symptom/` &&
        url.searchParams.get("encounter") === encounterId
      );
    });
    await page.goto(questionnaireUrl);
    await savedSymptoms;
  });

  test("should add symptom with all fields", async ({ page }) => {
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
    // The saved symptom is back in the form, so the duplicate check has the
    // existing row to compare against.
    await expect(page.getByRole("row", { name: symptomName })).toBeVisible();

    await selectSymptom(page, symptomName);

    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Symptom already exists!" }),
    ).toBeVisible();
  });
});
