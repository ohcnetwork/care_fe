import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";
import {
  frequencies,
  instructions,
  medicineNames,
} from "./prescriptionTestData";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Create Patient Prescription", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
    await page.getByText("View Encounter").first().click();
    await page.getByRole("tab", { name: "Medicines" }).click();
  });

  test("Add medication to patient prescription", async ({ page }) => {
    const medicineName = faker.helpers.arrayElement(medicineNames);
    const dosage = faker.number.int({ min: 1, max: 100 }).toString();
    const frequency = faker.helpers.arrayElement(frequencies);
    const selectedInstruction = faker.helpers.arrayElement(instructions);
    const notes = "testing notes";

    await test.step("Open prescription form", async () => {
      await page.getByRole("link", { name: /Create/i }).click();
      // Wait for the "Add Medication" button to be visible instead of networkidle
      await expect(
        page.getByText(/Add Medication|Add another Medication/i),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Add medication", async () => {
      await page.getByText(/Add Medication|Add another Medication/i).click();
    });

    await test.step("Select medicine from list", async () => {
      await page.getByRole("tab", { name: "Medication" }).click();
      await page.locator("input[data-slot='command-input']").fill(medicineName);
      await page.getByRole("option", { name: medicineName }).first().click();
      await expect(page.getByText(medicineName).first()).toBeVisible();
    });

    await test.step("Fill medication details", async () => {
      await page.getByPlaceholder("Enter a number...").first().click();
      await page.getByPlaceholder("Enter a number...").first().fill(dosage);
      await page.keyboard.press("Enter");

      await page.getByText("eg. 1-0-1").first().click();
      await page.getByPlaceholder("Type eg. 1-0-1").fill(frequency.input);
      await page
        .getByRole("option", { name: frequency.display })
        .nth(0)
        .click();

      // expand
      await page.getByTitle("Show Advanced Fields").first().click();

      await page
        .getByRole("button", { name: "No instructions selected" })
        .last()
        .click();
      await page.getByRole("option", { name: selectedInstruction }).click();

      await page.getByPlaceholder("Notes").last().fill(notes);
    });

    await test.step("Submit prescription", async () => {
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Questionnaire submitted successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify medication in table", async () => {
      // Wait for prescriptions API to respond after clicking tab
      await Promise.all([
        page.getByRole("tab", { name: "Medicines" }).click(),
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/medication/prescription/") &&
            resp.status() === 200,
        ),
      ]);
      await page
        .getByText(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} (AM|PM)$/)
        .first()
        .click();
      const table = page.getByRole("table");
      await expect(table).toBeVisible({ timeout: 10000 });
      await expect(table).toContainText(medicineName);
      await expect(table).toContainText(dosage);
      await expect(table).toContainText(frequency.display);
      await expect(table).toContainText(selectedInstruction);
      await expect(page.getByText(`Note${notes}`)).toBeVisible();
    });
  });
});
