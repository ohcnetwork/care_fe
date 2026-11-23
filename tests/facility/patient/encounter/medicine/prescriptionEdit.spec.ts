import { faker } from "@faker-js/faker";
import { prescribeMedicationViaUi } from "tests/helper/encounterCare";
import { submitAndExpectSuccess } from "tests/helper/questionnaire";
import { expect, test } from "tests/support/test";
import {
  frequencies,
  instructions,
  medicineNames,
} from "./prescriptionTestData";

test.use({ storageState: "tests/.auth/user.json" });

// The test prescribes on, then edits, a throwaway in-progress encounter of its
// own (the isolatedEncounter fixture), so the only prescription card holds
// its medicine.
test.describe("Edit Patient Prescription", () => {
  test(
    "Remove medication from patient prescription",
    { tag: ["@atomic", "@cap:encounter.medication.edit"] },
    async ({ page, facilityId, isolatedEncounter }) => {
      const medicineName = faker.helpers.arrayElement(medicineNames);
      const dosage = faker.number.int({ min: 1, max: 100 }).toString();
      const frequencyData = faker.helpers.arrayElement(frequencies);
      const selectedInstruction = faker.helpers.arrayElement(instructions);
      const notes = "testing notes";

      await prescribeMedicationViaUi(page, {
        facilityId,
        ...isolatedEncounter,
        medicineName,
        dosage,
        frequency: frequencyData,
        instruction: selectedInstruction,
        notes,
      });

      await test.step("Verify medication in All Prescriptions", async () => {
        // Wait for prescriptions API to respond after clicking tab
        await Promise.all([
          page.getByRole("tab", { name: "Medications" }).click(),
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
            await page.getByRole("link", { name: "Edit", exact: true }).click();
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
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify medication in stopped medications via All Prescriptions", async () => {
        // Wait for prescriptions API to respond after clicking tab
        await Promise.all([
          page.getByRole("tab", { name: "Medications" }).click(),
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
    },
  );
});
