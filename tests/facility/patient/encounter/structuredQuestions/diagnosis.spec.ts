import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });
let facilityId: string;
let diagnosisName: string;

async function navigateToEncounter(page: Page) {
  facilityId = getFacilityId();
  const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const createdDateBefore = format(new Date(), "yyyy-MM-dd");
  await page.goto(
    `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
  );
  await page.getByRole("button", { name: "View Encounter" }).first().click();
}

async function addDiagnosis(page: Page, severity?: string) {
  await page.getByRole("link", { name: "Diagnosis" }).click();
  await page.getByRole("combobox").filter({ hasText: "Add Diagnosis" }).click();
  await page.getByPlaceholder("Add Diagnosis").fill(diagnosisName);
  await page.getByRole("option", { name: diagnosisName, exact: true }).click();
  await page.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: severity }).click();
  await page.getByRole("button", { name: "Submit" }).click();
}

test.describe("Diagnosis", () => {
  test.beforeEach(async ({ page }) => {
    // Reset faker seed to ensure true randomness
    faker.seed();
    // Generate a random medical condition using Faker
    const diagnosisOptions = [
      "Chronic nonrheumatic intracranial subdural haematoma",
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
    diagnosisName = faker.helpers.arrayElement(diagnosisOptions);
    await navigateToEncounter(page);
  });

  test("add and display diagnosis with severity", async ({ page }) => {
    await addDiagnosis(page, "severe");
    await expect(
      page.getByRole("button", { name: "Diagnoses:" }),
    ).toBeVisible();

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
