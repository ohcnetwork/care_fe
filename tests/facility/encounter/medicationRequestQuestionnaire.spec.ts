import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// Static options for dosage units
const DOSAGE_UNITS = [
  "tablets",
  "gram",
  "milligram",
  "microgram",
  "milliliter",
  "drop",
  "international unit",
  "count",
] as const;

// Static options for frequency
const FREQUENCY_OPTIONS = [
  "BID (1-0-1)",
  "TID (1-1-1)",
  "QID (1-1-1-1)",
  "AM (1-0-0)",
  "PM (0-0-1)",
  "QD (Once a day)",
  "QOD (Alternate days)",
  "Q1H (Every 1 hour)",
  "Q2H (Every 2 hours)",
  "Q3H (Every 3 hours)",
  "Q4H (Every 4 hours)",
  "Q6H (Every 6 hours)",
  "Q8H (Every 8 hours)",
  "BED (0-0-1)",
  "WK (Weekly)",
  "MO (Monthly)",
] as const;

// Static options for duration units
const DURATION_UNITS = ["d", "h", "wk", "mo", "a"] as const;

// Static options for intent
const INTENT_OPTIONS = [
  "proposal",
  "plan",
  "order",
  "original order",
  "reflex order",
  "filler order",
  "instance order",
] as const;

test.describe("Medication Request Questionnaire", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let questionnaireUrl: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/medication_request`;

    await page.goto(questionnaireUrl);
  });

  // Helper function to add medication with required fields only
  async function addMedicationWithRequiredFields(page: any) {
    // Select medication from list
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Medication/i })
      .click();
    await page.getByRole("tab", { name: "Medication List" }).click();

    // Wait for options to load and get all medication options
    await page
      .getByRole("option")
      .filter({ hasText: /mg|tablet|capsule/i })
      .first()
      .waitFor({ state: "visible" });
    const medicationOptions = await page
      .getByRole("option")
      .filter({ hasText: /mg|tablet|capsule/i })
      .all();
    const randomMedicationIndex = faker.number.int({
      min: 0,
      max: medicationOptions.length - 1,
    });
    const randomMedication = medicationOptions[randomMedicationIndex];
    const medicationName = (await randomMedication.textContent()) || "";
    await randomMedication.click();

    // Fill dosage quantity (required)
    const dosageQuantity = faker.number.int({ min: 1, max: 100 });
    await page
      .locator('input[placeholder="Enter a number..."]:not([disabled])')
      .fill(dosageQuantity.toString());

    // Select random dosage unit (required)
    const randomDosageUnit = faker.helpers.arrayElement([...DOSAGE_UNITS]);
    await page
      .getByRole("option", {
        name: `${dosageQuantity} ${randomDosageUnit}`,
        exact: true,
      })
      .click();

    // Wait for previously added medications to load (avoid race condition)

    // Select random frequency (required) - target only enabled combobox
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select frequency" })
      .click();
    const randomFrequency = faker.helpers.arrayElement([...FREQUENCY_OPTIONS]);
    await page.getByRole("option").filter({ hasText: randomFrequency }).click();

    return {
      medicationName,
      dosageQuantity,
      dosageUnit: randomDosageUnit,
      frequency: randomFrequency,
    };
  }

  test("should add medication filling all fields", async ({ page }) => {
    // Select medication from list - handles both "Add Medication" and "Add another Medication"
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Medication/i })
      .click();
    await page.getByRole("tab", { name: "Medication List" }).click();

    // Wait for options to load and get all medication options
    await page
      .getByRole("option")
      .filter({ hasText: /mg|tablet|capsule/i })
      .first()
      .waitFor({ state: "visible" });
    const medicationOptions = await page
      .getByRole("option")
      .filter({ hasText: /mg|tablet|capsule/i })
      .all();
    const randomMedication = faker.helpers.arrayElement(medicationOptions);
    await randomMedication.click();

    // Fill dosage quantity
    const dosageQuantity = faker.number.int({ min: 1, max: 10 });
    await page
      .locator('input[placeholder="Enter a number..."]:not([disabled])')
      .fill(dosageQuantity.toString());

    // Select random dosage unit - click the visible option in the dropdown
    const randomDosageUnit = faker.helpers.arrayElement([...DOSAGE_UNITS]);
    await page
      .getByRole("option", {
        name: `${dosageQuantity} ${randomDosageUnit}`,
        exact: true,
      })
      .click();

    // Select random frequency - target only enabled combobox
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select frequency" })
      .click();
    const randomFrequency = faker.helpers.arrayElement([...FREQUENCY_OPTIONS]);
    await page.getByRole("option").filter({ hasText: randomFrequency }).click();

    // Fill duration
    const durationValue = faker.number.int({ min: 1, max: 30 });
    await page
      .locator('input[type="number"]:not([disabled])')
      .fill(durationValue.toString());

    // Select random duration unit - target only enabled combobox
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: /^d$|^h$|^mo$|^wk$|^a$/ })
      .click();
    const randomDurationUnit = faker.helpers.arrayElement([...DURATION_UNITS]);
    await page.getByRole("option", { name: randomDurationUnit }).click();

    // Select random additional instruction - target only enabled button
    await page
      .locator("button:not([disabled])")
      .filter({ hasText: "No instructions selected" })
      .click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const instructions = await page.getByRole("option").all();
    const randomInstruction = faker.helpers.arrayElement(instructions);
    await randomInstruction.click();

    // Select random route - target only enabled combobox
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select Route" })
      .click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const routes = await page.getByRole("option").all();
    const randomRoute = faker.helpers.arrayElement(routes);
    await randomRoute.click();

    // Select random site - target only enabled combobox
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select site" })
      .click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const sites = await page.getByRole("option").all();
    const randomSite = faker.helpers.arrayElement(sites);
    await randomSite.click();

    // Select random method - target only enabled combobox
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select method" })
      .click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const methods = await page.getByRole("option").all();
    const randomMethod = faker.helpers.arrayElement(methods);
    await randomMethod.click();

    // Select intent - scroll to the end horizontally and target only enabled combobox
    const intentCombobox = page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "order" });
    await intentCombobox.click();
    const randomIntent = faker.helpers.arrayElement([...INTENT_OPTIONS]);
    await page.getByRole("option", { name: randomIntent, exact: true }).click();

    // Add notes - scroll to the end and target the active notes field
    const notes = faker.lorem.sentence();
    await page
      .getByRole("textbox", { name: "Enter additional notes" })
      .last()
      .fill(notes);

    await page.getByRole("button", { name: "Submit" }).click();

    // Verify submission (wait for navigation or success message)
    await expect(page.getByRole("tab", { name: "Medicines" })).toBeVisible();
  });

  test("should add medication filling only required fields", async ({
    page,
  }) => {
    await addMedicationWithRequiredFields(page);

    // Submit with only required fields
    await page.getByRole("button", { name: "Submit" }).click();

    // Wait for submit button to complete (no longer disabled/loading)
    await page.waitForLoadState("networkidle");

    // Verify submission
    await expect(page.getByRole("tab", { name: "Medicines" })).toBeVisible();
  });

  test("should add medication and verify it appears in medication history", async ({
    page,
  }) => {
    // Add medication with required fields
    const addedMedication = await addMedicationWithRequiredFields(page);

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("tab", { name: "Medicines" })).toBeVisible();

    // Go back to medication request questionnaire
    await page.goto(questionnaireUrl);

    // Open Medication History
    await page.getByRole("button", { name: "Medication History" }).click();

    // Verify the added medication appears in the history
    const medicationRow = page.getByRole("row", {
      name: new RegExp(
        `${addedMedication.medicationName}.*` +
          `${addedMedication.dosageQuantity}.*` +
          `${addedMedication.dosageUnit}.*` +
          `${addedMedication.frequency.replace(/[()]/g, "\\$&")}`,
      ),
    });

    await expect(medicationRow).toBeVisible();
  });

  test("should select multiple medications from history and verify count", async ({
    page,
  }) => {
    // Open Medication History
    await page.getByRole("button", { name: "Medication History" }).click();

    // Wait for the table to load
    await page.waitForLoadState("networkidle");

    // Get all checkboxes after data has loaded
    const allCheckboxes = await page.getByRole("checkbox").all();
    const checkboxes = allCheckboxes.slice(1); // Skip first checkbox (header)
    // Skip test if no medications in history
    if (checkboxes.length === 0) {
      test.skip();
      return;
    }

    // Rest of the test...
    const selectCount = faker.number.int({
      min: 1,
      max: checkboxes.length,
    });

    const selectedIndices = faker.helpers
      .shuffle(Array.from({ length: checkboxes.length }, (_, i) => i))
      .slice(0, selectCount);

    for (const index of selectedIndices) {
      await checkboxes[index].click();
    }

    await expect(
      page.getByText(
        `${selectCount} past prescription${selectCount > 1 ? "s" : ""} selected`,
      ),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add Selected" }).click();

    await expect(
      page.getByRole("combobox").filter({ hasText: "Add another Medication" }),
    ).toBeVisible();
  });
});
