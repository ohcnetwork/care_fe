import { faker } from "@faker-js/faker";
import { prescribeMedicationViaUi } from "tests/helper/encounterCare";
import { expect, test } from "tests/support/test";
import {
  frequencies,
  instructions,
  medicineNames,
} from "./prescriptionTestData";

test.use({ storageState: "tests/.auth/user.json" });

// Each test prescribes on a throwaway in-progress encounter of its own (the
// isolatedEncounter fixture), not on the first one in a shared list.
test.describe("Create Patient Prescription", () => {
  test(
    "Add medication to patient prescription",
    { tag: ["@atomic", "@cap:encounter.medication.prescribe"] },
    async ({ page, facilityId, isolatedEncounter }) => {
      const medicineName = faker.helpers.arrayElement(medicineNames);
      // Use a non-unit dose (value !== 1) so the dosage is highlighted
      const dosage = faker.number.int({ min: 2, max: 100 }).toString();
      const frequency = faker.helpers.arrayElement(frequencies);
      const selectedInstruction = faker.helpers.arrayElement(instructions);
      // Identify this attempt's medication even when the encounter contains
      // prescriptions for the same medicine from retries.
      const notes = `Highlighted dosage ${faker.string.uuid()}`;

      await prescribeMedicationViaUi(page, {
        facilityId,
        ...isolatedEncounter,
        medicineName,
        dosage,
        frequency,
        instruction: selectedInstruction,
        notes,
      });

      await test.step("Verify medication in table", async () => {
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
        const medicationRow = table
          .getByRole("row")
          .filter({ has: page.getByText(notes, { exact: true }) });
        await expect(medicationRow).toHaveCount(1);
        await expect(medicationRow).toBeVisible();
        await expect(medicationRow).toContainText(medicineName);
        await expect(medicationRow).toContainText(frequency.display);
        await expect(medicationRow).toContainText(selectedInstruction);
        const dosageCell = medicationRow.getByRole("cell").nth(1);
        await expect(dosageCell).toHaveText(new RegExp(`^${dosage} `));
        // Non-unit dosages (value !== 1) are visually highlighted
        const highlightedDosage = dosageCell.locator(".bg-yellow-100");
        await expect(highlightedDosage).toHaveCount(1);
        await expect(highlightedDosage).toBeVisible();
      });
    },
  );

  test(
    "Unit dosage is not highlighted in patient prescription",
    { tag: ["@atomic", "@cap:encounter.medication.prescribe"] },
    async ({ page, facilityId, isolatedEncounter }) => {
      const medicineName = faker.helpers.arrayElement(medicineNames);
      // Use a unit dose (value === 1) so the dosage is NOT highlighted
      const dosage = "1";
      const frequency = faker.helpers.arrayElement(frequencies);
      const selectedInstruction = faker.helpers.arrayElement(instructions);
      const notes = `Unit dosage ${faker.string.uuid()}`;

      await prescribeMedicationViaUi(page, {
        facilityId,
        ...isolatedEncounter,
        medicineName,
        dosage,
        frequency,
        instruction: selectedInstruction,
        notes,
      });

      await test.step("Verify medication is not highlighted in table", async () => {
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
        const medicationRow = table
          .getByRole("row")
          .filter({ has: page.getByText(notes, { exact: true }) });
        await expect(medicationRow).toHaveCount(1);
        await expect(medicationRow).toBeVisible();
        await expect(medicationRow).toContainText(medicineName);
        await expect(medicationRow).toContainText(frequency.display);
        await expect(medicationRow).toContainText(selectedInstruction);
        const dosageCell = medicationRow.getByRole("cell").nth(1);
        await expect(dosageCell).toHaveText(new RegExp(`^${dosage} `));
        // Unit dosages (value === 1) are NOT visually highlighted
        await expect(dosageCell.locator(".bg-yellow-100")).toHaveCount(0);
      });
    },
  );
});
