import { expect, test } from "@playwright/test";
import { subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });
let facilityId: string;
let diagnosisName: string = "Chronic pain";

async function navigateToEncounter(page: any) {
  facilityId = getFacilityId();
  const createdDateAfter = subDays(new Date(), 90).toISOString().split("T")[0];
  const createdDateBefore = new Date().toISOString().split("T")[0];
  await page.goto(
    `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
  );
  await page.getByRole("button", { name: "View Encounter" }).first().click();
}

async function addDiagnosis(page: any, severity?: string) {
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
