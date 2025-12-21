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

test.describe("Edit Patient Prescription", () => {
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

  test("Remove medication from patient prescription", async ({ page }) => {
    const medicineName = faker.helpers.arrayElement(medicineNames);
    const dosage = faker.number.int({ min: 1, max: 100 }).toString();
    const frequency = faker.helpers.arrayElement(frequencies);
    const selectedInstruction = faker.helpers.arrayElement(instructions);
    const notes = "testing notes";

    await test.step("Open prescription form", async () => {
      await page
        .getByRole("link", { name: /Add|Edit|Create Prescription/i })
        .click();
      // Wait for the "Add Medication" button to be visible instead of networkidle
      await expect(
        page.getByText(/Add Medication|Add another Medication/i),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Add medication", async () => {
      await page.getByText(/Add Medication|Add another Medication/i).click();
    });

    await test.step("Select medicine from list", async () => {
      await page.getByRole("tab", { name: "Medication List" }).click();
      await page.locator("input[data-slot='command-input']").fill(medicineName);
      await page.getByRole("option", { name: medicineName }).first().click();
      await expect(page.getByText(medicineName).first()).toBeVisible();
    });

    await test.step("Fill medication details", async () => {
      await page.getByPlaceholder("Enter a number...").last().click();
      await page.getByPlaceholder("Enter a number...").last().fill(dosage);
      await page.keyboard.press("Enter");

      await page.getByText("Select frequency").last().click();
      await page.getByRole("option", { name: frequency }).click();

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
      await page.getByRole("tab", { name: "Medicines" }).click();
      const table = page.getByRole("table");
      await expect(table).toBeVisible({ timeout: 10000 });
      await expect(table).toContainText(medicineName);
      await expect(table).toContainText(dosage);
      await expect(table).toContainText(frequency);
      await expect(table).toContainText(selectedInstruction);
      await expect(table).toContainText(notes);
    });

    await test.step("Edit prescription to remove medication", async () => {
      await page
        .getByRole("link", { name: /Add|Edit|Create Prescription/i })
        .click();
      // Wait for medication to be visible instead of networkidle
      await expect(page.getByText(medicineName).first()).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step("Remove medication", async () => {
      await page
        .getByRole("button", { name: /remove medication/i })
        .first()
        .click();
      await page.getByRole("button", { name: "Remove" }).click();
    });

    await test.step("Submit updated prescription", async () => {
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Questionnaire submitted successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify medication in stopped medications", async () => {
      await page.getByRole("tab", { name: "Medicines" }).click();
      await page.getByText(/Show \d+ Inactive Medications?/i).click();
      const table = page.getByRole("table");
      await expect(table).toContainText(medicineName);
      await expect(table).toContainText(dosage);
      await expect(table).toContainText(frequency);
      await expect(table).toContainText(selectedInstruction);
      await expect(table).toContainText(notes);
    });
  });
});
