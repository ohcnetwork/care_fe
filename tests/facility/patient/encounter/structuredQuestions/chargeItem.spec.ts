import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const MedicationsList = ["Ibuprofen", "Paracetamol", "Amoxicillin"];

test.describe("Charge Item Questionnaire", () => {
  let randomMedicationsList: string;
  const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const createdDateBefore = format(new Date(), "yyyy-MM-dd");

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    randomMedicationsList = faker.helpers.arrayElement(MedicationsList);

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
  });

  test("Create a Medication Charge Item", async ({ page }) => {
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    // Wait for URL to change and page to be ready
    await expect(page).toHaveURL(/\/encounter\/.*\/updates/, {
      timeout: 10000,
    });
    const currentUrl = page.url();
    const targetUrl = currentUrl.replace(
      "/updates",
      "/questionnaire/charge_item",
    );

    await page.goto(targetUrl);

    await page.getByRole("combobox").filter({ hasText: "Add charges" }).click();
    await page.getByText("Medications").click();
    await page.getByText(randomMedicationsList).click();

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Questionnaire submitted")).toBeVisible();
  });
});
