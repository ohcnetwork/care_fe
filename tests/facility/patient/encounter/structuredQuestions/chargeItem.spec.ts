import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const MedicationsList = ["Ibuprofen", "Paracetamol", "Amoxicillin"];

test.describe("Charge Item Questionnaire", () => {
  let randomMedicationsList: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    randomMedicationsList = faker.helpers.arrayElement(MedicationsList);

    await page.goto(`/facility/${facilityId}/encounters/patients/all`);
  });

  test("Create a Medication Charge Item", async ({ page }) => {
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForLoadState("networkidle");
    const currentUrl = page.url();
    const targetUrl = currentUrl.replace(
      "/updates",
      "/questionnaire/charge_item",
    );

    await page.goto(targetUrl);

    await page
      .getByRole("combobox")
      .filter({ hasText: "Select charge item definition" })
      .click();
    await page.getByText("Medications").click();
    await page.getByText(randomMedicationsList).click();

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Questionnaire submitted")).toBeVisible();
  });
});
