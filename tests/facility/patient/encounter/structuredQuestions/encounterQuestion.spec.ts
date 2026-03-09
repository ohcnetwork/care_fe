import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Question - Status Dropdown", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let questionnaireUrl: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter`;

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");
  });

  test("should not show Discharged and Unknown in the Encounter Status dropdown", async ({
    page,
  }) => {
    // Find the Encounter Status section by its label and open the dropdown
    const statusSection = page
      .locator("div.space-y-2")
      .filter({ hasText: "Encounter Status" })
      .first();
    await statusSection.getByRole("combobox").click();

    // Verify "Discharged" is not an option
    await expect(
      page.getByRole("option", { name: "Discharged", exact: true }),
    ).not.toBeVisible();

    // Verify "Unknown" is not an option
    await expect(
      page.getByRole("option", { name: "Unknown", exact: true }),
    ).not.toBeVisible();
  });

  test("should show Mark for Discharge button when encounter is not discharged", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Mark for discharge" }),
    ).toBeVisible();
  });

  test("should lock dropdown to Discharged after clicking Mark for Discharge", async ({
    page,
  }) => {
    // Click "Mark for discharge" button
    await page.getByRole("button", { name: "Mark for discharge" }).click();

    // Find the Encounter Status section
    const statusSection = page
      .locator("div.space-y-2")
      .filter({ hasText: "Encounter Status" })
      .first();
    const statusDropdown = statusSection.getByRole("combobox");

    // The status dropdown should now show "Discharged" as the selected value
    await expect(statusDropdown).toContainText("Discharged");

    // The dropdown should be disabled (locked)
    await expect(statusDropdown).toBeDisabled();

    // The "Mark for discharge" button should no longer be visible
    await expect(
      page.getByRole("button", { name: "Mark for discharge" }),
    ).not.toBeVisible();
  });
});
