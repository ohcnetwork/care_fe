import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const INT_MAX = 100; // Arbitrary upper limit for integer fields
const DOSAGE_UNITS = [
  "tablets",
  "gram",
  "milligram",
  "microgram",
  "milliliter",
  "drop",
  "international unit",
  "count",
];

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
];

const DURATION_UNITS = ["d", "h", "wk", "mo", "a"];

const INTENT_OPTIONS = [
  "proposal",
  "plan",
  "order",
  "original order",
  "reflex order",
  "filler order",
  "instance order",
];

const medicationOptions = [
  "Senna 15 mg oral tablet",
  "Zinc 50 mg oral capsule",
  "Zinc 25 mg oral capsule",
  "Doxepin 3 mg oral tablet",
  "Doxepin 6 mg oral tablet",
  "Estriol 1 mg oral tablet",
  "Mesna 400 mg oral tablet",
  "Mesna 600 mg oral tablet",
  "Senna 7.5 mg oral tablet",
  "Apixaban 5 mg oral tablet",
];

const instructionOptions = [
  "Until symptoms improve",
  "Until next appointment",
  "Take on an empty stomach",
  "Use with caution",
  "Then stop",
  "Until finished",
  "Follow directions",
  "Then discontinue",
  "Until gone",
  "To be spread thinly",
];

const routeOptions = [
  "Sublabial route",
  "Subretinal route",
  "Posterior juxtascleral route",
  "Peritumoural route",
  "Intraportal route",
];

const siteOptions = [
  "Structure of product of conception of ectopic pregnancy",
  "Structure of left deltoid muscle",
  "Structure of right deltoid muscle",
  "Structure of right supraclavicular lymph node",
  "Structure of left supraclavicular lymph node",
  "Structure of colonic submucosa and/or colonic muscularis propria",
];

const methodOptions = [
  "Bathe",
  "Dialysis system",
  "Insufflate",
  "Implantation",
  "Orodisperse",
  "Rinse or wash",
  "Gargle",
  "Rinse",
];

test.describe("Medication Request Questionnaire", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let questionnaireUrl: string;
  let medicationName: string;
  let dosageQuantity: number;
  let dosageUnit: string;
  let frequency: string;
  let durationUnit: string;
  let duration: number;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
    medicationName = faker.helpers.arrayElement(medicationOptions);
    dosageQuantity = faker.number.int(INT_MAX);
    dosageUnit = faker.helpers.arrayElement(DOSAGE_UNITS);
    frequency = faker.helpers.arrayElement(FREQUENCY_OPTIONS);
    durationUnit = faker.helpers.arrayElement(DURATION_UNITS);
    duration = faker.number.int({ min: 1, max: INT_MAX });

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/medication_request`;

    await page.goto(questionnaireUrl);
  });

  test("should add medication filling all fields and verify it appears in medication history", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add Medication/i })
      .click();
    await page.getByRole("tab", { name: "Medication" }).click();
    await page.getByPlaceholder(/Search Medications/i).fill(medicationName);
    await page
      .getByRole("option", { name: medicationName, exact: true })
      .click();

    await page
      .locator('input[placeholder="Enter a number..."]:not([disabled])')
      .fill(dosageQuantity.toString());

    // Select random dosage unit - click the visible option in the dropdown
    await page
      .getByRole("option", {
        name: `${dosageQuantity} ${dosageUnit}`,
        exact: true,
      })
      .click();

    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select frequency" })
      .click();
    await page.getByRole("option").filter({ hasText: frequency }).click();

    await page
      .locator('input[type="number"]:not([disabled])')
      .fill(duration.toString());

    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: /^d$|^h$|^mo$|^wk$|^a$/ })
      .click();
    await page.getByRole("option", { name: durationUnit }).click();

    // Select random additional instruction - target only enabled button
    const instruction = faker.helpers.arrayElement(instructionOptions);

    await page.getByTitle("Show Advanced Fields").first().click();
    await page
      .locator("button:not([disabled])")
      .filter({ hasText: "No instructions selected" })
      .click();
    await page
      .getByPlaceholder(/Select additional instructions/i)
      .fill(instruction);
    await page.getByRole("option", { name: instruction, exact: true }).click();

    const route = faker.helpers.arrayElement(routeOptions);
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select Route" })
      .click();
    await page.getByPlaceholder(/Select Route/i).fill(route);
    await page.getByRole("option", { name: route, exact: true }).click();

    const site = faker.helpers.arrayElement(siteOptions);
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select site" })
      .click();
    await page.getByPlaceholder(/Select site/i).fill(site);
    await page.getByRole("option", { name: site, exact: true }).click();

    const method = faker.helpers.arrayElement(methodOptions);
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select method" })
      .click();
    await page.getByRole("option", { name: method, exact: true }).click();

    // Select intent - scroll to the end horizontally and target only enabled combobox
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "order" })
      .click();
    const intent = faker.helpers.arrayElement(INTENT_OPTIONS);
    await page.getByRole("option", { name: intent, exact: true }).click();

    // Add notes - scroll to the end and target the active notes field
    const notes = faker.lorem.sentence();
    await page
      .getByRole("textbox", { name: "Enter additional notes" })
      .last()
      .fill(notes);

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.getByRole("button", { name: "Medication History" }).click();

    const historyDialog = page.getByRole("dialog", {
      name: "Medication History",
    });
    await historyDialog.waitFor({ state: "visible" });
    const medicationRow = page
      .locator('[data-slot="table-body"] tr')
      .filter({ hasText: medicationName })
      .filter({ hasText: `${dosageQuantity.toFixed(2)} ${dosageUnit}` })
      .filter({ hasText: frequency })
      .filter({ hasText: `${duration} ${durationUnit}` });

    await expect(medicationRow).toBeVisible();
  });

  test("add medication with only required fields and verify it appears in medication history", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add Medication/i })
      .click();
    await page.getByRole("tab", { name: "Medication" }).click();
    await page.getByPlaceholder(/Search Medications/i).fill(medicationName);
    await page
      .getByRole("option", { name: medicationName, exact: true })
      .click();

    await page
      .locator('input[placeholder="Enter a number..."]:not([disabled])')
      .fill(dosageQuantity.toString());

    // Select random dosage unit - click the visible option in the dropdown
    await page
      .getByRole("option", {
        name: `${dosageQuantity} ${dosageUnit}`,
        exact: true,
      })
      .click();

    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "Select frequency" })
      .click();
    await page.getByRole("option").filter({ hasText: frequency }).click();

    await page
      .locator('input[type="number"]:not([disabled])')
      .fill(duration.toString());

    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: /^d$|^h$|^mo$|^wk$|^a$/ })
      .click();
    await page.getByRole("option", { name: durationUnit }).click();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.getByRole("button", { name: "Medication History" }).click();

    const historyDialog = page.getByRole("dialog", {
      name: "Medication History",
    });
    await historyDialog.waitFor({ state: "visible" });
    const medicationRow = page
      .locator('[data-slot="table-body"] tr')
      .filter({ hasText: medicationName })
      .filter({ hasText: `${dosageQuantity.toFixed(2)} ${dosageUnit}` })
      .filter({ hasText: frequency })
      .filter({ hasText: `${duration} ${durationUnit}` });

    await expect(medicationRow).toBeVisible();
  });

  test("should show validation errors when required fields are missing", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add Medication/i })
      .click();
    await page.getByRole("tab", { name: "Medication" }).click();
    await page.getByPlaceholder(/Search Medications/i).fill(medicationName);
    await page
      .getByRole("option", { name: medicationName, exact: true })
      .click();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Dosage*+This field is required"),
    ).toBeVisible();

    await expect(
      page.locator("div").filter({
        hasText: /^Frequency\*Select frequencyThis field is required$/,
      }),
    ).toBeVisible();
  });
});
