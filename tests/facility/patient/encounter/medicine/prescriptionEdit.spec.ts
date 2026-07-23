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
    const frequencyData = faker.helpers.arrayElement(frequencies);
    const selectedInstruction = faker.helpers.arrayElement(instructions);
    const notes = "testing notes";

    await test.step("Open prescription form", async () => {
      await page.getByRole("link", { name: /Create/i }).click();
      await expect(
        page.getByText(/Add Medication|Add another Medication/i),
      ).toBeVisible();
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
      const dosageInput = page.getByPlaceholder("Enter a number...").first();
      await dosageInput.waitFor({ state: "visible" });
      await dosageInput.click();
      await dosageInput.fill(dosage);
      await expect(dosageInput).toHaveValue(dosage);
      await page.keyboard.press("Enter");

      await page.getByText("eg. 1-0-1").first().click();
      await page.getByPlaceholder("Type eg. 1-0-1").fill(frequencyData.input);
      await page
        .getByRole("option", { name: frequencyData.display })
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
      ).toBeVisible();
    });

    await test.step("Verify medication in All Prescriptions", async () => {
      // Wait for prescriptions API to respond after clicking tab
      await Promise.all([
        page.getByRole("tab", { name: "Medicines" }).click(),
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/medication/prescription/") &&
            resp.status() === 200,
        ),
      ]);
      // Click "All Prescriptions" sidebar card to see all medicines
      await page
        .locator("[data-slot='card']")
        .filter({ hasText: "View all medications" })
        .click();
      const table = page.getByRole("table");
      await expect(table).toBeVisible();
      await expect(table).toContainText(medicineName);
    });

    await test.step("Find prescription card with medicine and edit", async () => {
      // Loop through individual prescription date cards to find our medicine
      const prescriptionCards = page.getByText(
        /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} (AM|PM)$/,
      );
      await expect(prescriptionCards.first()).toBeVisible();
      const count = await prescriptionCards.count();
      let foundCard = false;
      for (let i = 0; i < count; i++) {
        const card = prescriptionCards.nth(i);
        await card.click();
        const table = page.getByRole("table");
        await expect(table).toBeVisible();
        const content = await table.textContent();
        if (content?.includes(medicineName)) {
          foundCard = true;
          // Click Edit on this prescription card
          await page.getByRole("link", { name: /Edit/i }).click();
          break;
        }
      }
      expect(foundCard).toBe(true);
    });

    await test.step("Remove medication", async () => {
      await page
        .getByRole("button", { name: "Medication actions" })
        .first()
        .click();
      await page.getByRole("menuitem", { name: "Remove" }).click();
      await page.getByRole("button", { name: "Remove" }).click();
    });

    await test.step("Submit updated prescription", async () => {
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Questionnaire submitted successfully"),
      ).toBeVisible();
    });

    await test.step("Verify medication in stopped medications via All Prescriptions", async () => {
      // Wait for prescriptions API to respond after clicking tab
      await Promise.all([
        page.getByRole("tab", { name: "Medicines" }).click(),
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/medication/prescription/") &&
            resp.status() === 200,
        ),
      ]);
      // Click "All Prescriptions" sidebar card to see all medicines
      await page
        .locator("[data-slot='card']")
        .filter({ hasText: "View all medications" })
        .click();
      const table = page.getByRole("table");
      await expect(table).toBeVisible();
      // Expand inactive medications
      await expect(
        page.getByText(/Show \d+ Inactive Medications?/i),
      ).toBeVisible();
      await page.getByText(/Show \d+ Inactive Medications?/i).click();
      // Verify the removed medicine appears in inactive list
      await expect(table).toContainText(medicineName);
    });
  });
});
