import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import { openQuestionnaireFillViaUi } from "tests/helper/questionnaire";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { firstValueSetDisplay } from "tests/helper/valueSet";

/**
 * Step functions for the structured questions (diagnosis, symptom, allergy,
 * medication request, charge item) on the encounter fill page. Each one
 * opens the fixed pseudo-questionnaire for the encounter, records one row,
 * saves, and waits for the success toast — content assertions stay in the
 * specs.
 */

/** The encounter a structured step writes to. */
export interface EncounterTarget {
  facilityId: string;
  patientId: string;
  encounterId: string;
}

export const CLINICAL_STATUS_OPTIONS = [
  "Active",
  "Recurrence",
  "Relapse",
  "Inactive",
  "Remission",
  "Resolved",
] as const;

export const VERIFICATION_STATUS_OPTIONS = [
  "Unconfirmed",
  "Provisional",
  "Differential",
  "Confirmed",
  "Refuted",
] as const;

export const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"] as const;

interface ConditionRowInput extends EncounterTarget {
  clinicalStatus?: string;
  severity?: string;
  verificationStatus?: string;
}

/** Picks a diagnosis code in the open diagnosis question (no save). */
export async function selectDiagnosis(page: Page, diagnosisName: string) {
  await page
    .getByRole("combobox")
    .filter({ hasText: /Add (another )?Diagnosis/i })
    .click();
  await page.getByPlaceholder(/Add (another )?Diagnosis/i).fill(diagnosisName);
  await page
    .getByTestId("valueset-search-results")
    .getByRole("option", { name: diagnosisName, exact: true })
    .click();
}

/** Picks a symptom code in the open symptom question (no save). */
export async function selectSymptom(page: Page, name: string) {
  await page
    .getByRole("combobox")
    .filter({ hasText: /Add (another )?Symptom/i })
    .click();
  await page.getByPlaceholder(/Add (another )?Symptom/i).fill(name);
  await page
    .getByTestId("valueset-search-results")
    .getByRole("option", { name, exact: true })
    .click();
}

/** Sets the status/severity/verification cells of a condition row. */
async function setConditionCells(
  page: Page,
  name: string,
  { clinicalStatus, severity, verificationStatus }: ConditionRowInput,
) {
  const row = page.getByRole("row", { name });
  if (clinicalStatus) {
    await row.getByRole("cell").nth(2).click();
    await page
      .getByRole("option", { name: clinicalStatus, exact: true })
      .click();
  }
  if (severity) {
    await row.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity, exact: true }).click();
  }
  if (verificationStatus) {
    await row.getByRole("cell").nth(4).click();
    await page
      .getByRole("option", { name: verificationStatus, exact: true })
      .click();
    await expect(row.getByRole("cell").nth(4)).toContainText(
      verificationStatus,
    );
  }
}

async function saveAndExpectSubmitted(page: Page) {
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(
    page.getByText("Questionnaire submitted successfully"),
  ).toBeVisible();
}

/**
 * Records a diagnosis on the encounter through the diagnosis questionnaire.
 * Without `diagnosisName`, uses the first code of `system-condition-code`.
 */
export async function addDiagnosisViaUi(
  page: Page,
  input: ConditionRowInput & { diagnosisName?: string },
): Promise<{ diagnosisName: string }> {
  return test.step(
    "questionnaire.structured.diagnosis.create",
    async () => {
      const diagnosisName =
        input.diagnosisName ??
        (await firstValueSetDisplay("system-condition-code", input.facilityId));
      await openQuestionnaireFillViaUi(page, { ...input, slug: "diagnosis" });
      await page.waitForLoadState("networkidle");
      await selectDiagnosis(page, diagnosisName);
      await setConditionCells(page, diagnosisName, input);
      await saveAndExpectSubmitted(page);
      return { diagnosisName };
    },
    { box: true },
  );
}

/**
 * Records a symptom on the encounter through the symptom questionnaire.
 * Without `symptomName`, uses the first code of `system-symptom-code`.
 */
export async function addSymptomViaUi(
  page: Page,
  input: ConditionRowInput & { symptomName?: string },
): Promise<{ symptomName: string }> {
  return test.step(
    "questionnaire.structured.symptom.create",
    async () => {
      const symptomName =
        input.symptomName ??
        (await firstValueSetDisplay("system-symptom-code", input.facilityId));
      await openQuestionnaireFillViaUi(page, { ...input, slug: "symptom" });
      await page.waitForLoadState("networkidle");
      await selectSymptom(page, symptomName);
      await setConditionCells(page, symptomName, input);
      await saveAndExpectSubmitted(page);
      return { symptomName };
    },
    { box: true },
  );
}

/**
 * Records an allergy from the encounter's "Add Allergy" link. Without
 * `allergyName`, uses the first code of `system-allergy-code`.
 */
export async function addAllergyViaUi(
  page: Page,
  input: EncounterTarget & { allergyName?: string },
): Promise<{ allergyName: string }> {
  return test.step(
    "questionnaire.structured.allergy.create",
    async () => {
      const { facilityId, patientId, encounterId } = input;
      const allergyName =
        input.allergyName ??
        (await firstValueSetDisplay("system-allergy-code", facilityId));
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
      );
      await page
        .getByRole("link", { name: "Add Allergy", exact: true })
        .click();

      const combobox = page
        .getByRole("combobox")
        .filter({ hasText: /Add Allergy|Add another Allergy/i });
      await combobox.scrollIntoViewIfNeeded();
      await combobox.click();

      await page.locator("[cmdk-input]").waitFor({ state: "visible" });
      await page.locator("[cmdk-input]").fill(allergyName);

      const option = page
        .getByTestId("valueset-search-results")
        .getByRole("option", { name: allergyName, exact: true });
      await option.scrollIntoViewIfNeeded();
      await option.click();

      await page
        .getByRole("button", { name: "Save Changes", exact: true })
        .click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Questionnaire submitted successfully"),
      ).toBeVisible({ timeout: 10000 });
      return { allergyName };
    },
    { box: true },
  );
}

export const MEDICATION_OPTIONS = [
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

/** Arbitrary upper limit for the medication integer fields. */
export const MEDICATION_INT_MAX = 70;

export const MEDICATION_DOSAGE_UNITS = [
  "tablets",
  "gram",
  "milligram",
  "microgram",
  "milliliter",
  "drop",
  "international unit",
  "count",
];

export const MEDICATION_DURATION_UNITS = [
  "days",
  "hours",
  "weeks",
  "months",
  "years",
];

export const MEDICATION_FREQUENCIES = [
  { input: "1-0-1", display: "1-0-1 (Twice a day)" },
  { input: "1-1-1", display: "1-1-1 (Thrice a day)" },
  { input: "1-1-1-1", display: "1-1-1-1 (Four times a day)" },
  { input: "Q2H", display: "Q2H (Every 2 hours)" },
  { input: "Q1H", display: "Q1H (Every 1 hour)" },
];

export const MEDICATION_INTENT_OPTIONS = [
  "proposal",
  "plan",
  "order",
  "original order",
  "reflex order",
  "filler order",
  "instance order",
];

export const MEDICATION_INSTRUCTION_OPTIONS = [
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

export const MEDICATION_ROUTE_OPTIONS = [
  "Sublabial route",
  "Subretinal route",
  "Posterior juxtascleral route",
  "Peritumoural route",
  "Intraportal route",
];

export const MEDICATION_SITE_OPTIONS = [
  "Structure of product of conception of ectopic pregnancy",
  "Structure of left deltoid muscle",
  "Structure of right deltoid muscle",
  "Structure of right supraclavicular lymph node",
  "Structure of left supraclavicular lymph node",
  "Structure of colonic submucosa and/or colonic muscularis propria",
];

export const MEDICATION_METHOD_OPTIONS = [
  "Bathe",
  "Dialysis system",
  "Insufflate",
  "Implantation",
  "Orodisperse",
  "Rinse or wash",
  "Gargle",
  "Rinse",
];

/** Adds a medication to the open medication request question (no save). */
export async function selectMedication(page: Page, medicationName: string) {
  await page
    .getByRole("combobox")
    .filter({ hasText: /Add Medication/i })
    .click();
  await page.getByRole("tab", { name: "Medication" }).click();
  await page.getByPlaceholder(/Search Medications/i).fill(medicationName);
  await page.getByRole("option", { name: medicationName, exact: true }).click();
}

/**
 * Picks a duration in the medication row. Duration is a native input with
 * plain <button> suggestions in the popover; exact-match avoids catching the
 * range / period action buttons. The popover trigger wrapping the input is
 * itself a button named by the typed value, so the suggestion is scoped to
 * the popover content.
 */
export async function selectDuration(
  page: Page,
  duration: number,
  unit: string,
) {
  const field = page.getByRole("textbox", { name: "Duration" });
  await field.click();
  await field.fill(`${duration} ${unit}`);
  await page
    .locator('[data-slot="popover-content"]')
    .getByRole("button", { name: `${duration} ${unit}`, exact: true })
    .click();
}

export interface MedicationAdvancedFields {
  instruction?: string;
  route?: string;
  site?: string;
  method?: string;
  intent?: string;
  notes?: string;
}

export interface AddMedicationRequestInput extends EncounterTarget {
  medicationName?: string;
  dosageQuantity?: number;
  dosageUnit?: string;
  frequency?: { input: string; display: string };
  /** At least 2: DurationInput renders singulars ("1 day"), which would
   *  break the exact-match suggestion lookup. */
  duration?: number;
  durationUnit?: string;
  /** Also fills instructions, route, site, method, intent and notes —
   *  random values for any left out. */
  advanced?: MedicationAdvancedFields;
}

/**
 * Prescribes a medication through the medication request questionnaire.
 * Values left out are picked at random; the ones used are returned in the
 * form the medication history shows them.
 */
export async function addMedicationRequestViaUi(
  page: Page,
  input: AddMedicationRequestInput,
): Promise<{
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
}> {
  return test.step(
    "questionnaire.structured.medication-request.create",
    async () => {
      const medicationName =
        input.medicationName ?? faker.helpers.arrayElement(MEDICATION_OPTIONS);
      const dosageQuantity =
        input.dosageQuantity ?? faker.number.int(MEDICATION_INT_MAX);
      const dosageUnit =
        input.dosageUnit ?? faker.helpers.arrayElement(MEDICATION_DOSAGE_UNITS);
      const frequency =
        input.frequency ?? faker.helpers.arrayElement(MEDICATION_FREQUENCIES);
      const durationUnit =
        input.durationUnit ??
        faker.helpers.arrayElement(MEDICATION_DURATION_UNITS);
      const duration =
        input.duration ?? faker.number.int({ min: 2, max: MEDICATION_INT_MAX });

      await openQuestionnaireFillViaUi(page, {
        ...input,
        slug: "medication_request",
      });
      await page.waitForLoadState("networkidle");

      await selectMedication(page, medicationName);

      await page
        .locator('input[placeholder="Enter a number..."]:not([disabled])')
        .fill(dosageQuantity.toString());
      // Select the dosage unit - click the visible option in the dropdown
      await page
        .getByRole("option", {
          name: `${dosageQuantity} ${dosageUnit}`,
          exact: true,
        })
        .click();

      await page
        .locator('button[role="combobox"]:not([disabled])')
        .filter({ hasText: "eg. 1-0-1" })
        .click();
      await page.getByPlaceholder("Type eg. 1-0-1").fill(frequency.input);
      await page.getByRole("option", { name: frequency.display }).click();

      await selectDuration(page, duration, durationUnit);

      if (input.advanced) {
        await fillMedicationAdvancedFields(page, input.advanced);
      }

      await saveAndExpectSubmitted(page);
      return {
        medicationName,
        dosage: `${dosageQuantity} ${dosageUnit}`,
        frequency: frequency.display,
        duration: `${duration} ${durationUnit}`,
      };
    },
    { box: true },
  );
}

async function fillMedicationAdvancedFields(
  page: Page,
  advanced: MedicationAdvancedFields,
) {
  // Additional instruction - target only the enabled button
  const instruction =
    advanced.instruction ??
    faker.helpers.arrayElement(MEDICATION_INSTRUCTION_OPTIONS);

  await page.getByTitle("Show Advanced Fields").first().click();
  await page
    .locator("button:not([disabled])")
    .filter({ hasText: "No instructions selected" })
    .click();
  await page
    .getByPlaceholder(/Select additional instructions/i)
    .fill(instruction);
  await page.getByRole("option", { name: instruction, exact: true }).click();

  const route =
    advanced.route ?? faker.helpers.arrayElement(MEDICATION_ROUTE_OPTIONS);
  await page
    .locator('button[role="combobox"]:not([disabled])')
    .filter({ hasText: "Select Route" })
    .click();
  await page.getByPlaceholder(/Select Route/i).fill(route);
  await page.getByRole("option", { name: route, exact: true }).click();

  const site =
    advanced.site ?? faker.helpers.arrayElement(MEDICATION_SITE_OPTIONS);
  await page
    .locator('button[role="combobox"]:not([disabled])')
    .filter({ hasText: "Select site" })
    .click();
  await page.getByPlaceholder(/Select site/i).fill(site);
  await page.getByRole("option", { name: site, exact: true }).click();

  const method =
    advanced.method ?? faker.helpers.arrayElement(MEDICATION_METHOD_OPTIONS);
  await page
    .locator('button[role="combobox"]:not([disabled])')
    .filter({ hasText: "Select method" })
    .click();
  await page.getByRole("option", { name: method, exact: true }).click();

  // Intent - target only the enabled combobox
  await page
    .locator('button[role="combobox"]:not([disabled])')
    .filter({ hasText: "order" })
    .click();
  const intent =
    advanced.intent ?? faker.helpers.arrayElement(MEDICATION_INTENT_OPTIONS);
  await page.getByRole("option", { name: intent, exact: true }).click();

  // Notes - target the active notes field
  const notes = advanced.notes ?? faker.lorem.sentence();
  await page
    .getByRole("textbox", { name: "Enter additional notes" })
    .last()
    .fill(notes);
}

/** Charge item definitions seeded under the fixture facility's "Medications"
 *  category. */
export const MEDICATION_CHARGE_ITEM_DEFINITIONS = [
  "Ibuprofen",
  "Paracetamol",
  "Amoxicillin",
];

/**
 * Adds a charge item to the encounter through the charge item
 * questionnaire. Defaults to a random fixture definition under
 * "Medications".
 */
export async function addStructuredChargeItemViaUi(
  page: Page,
  input: EncounterTarget & { category?: string; definitionName?: string },
): Promise<{ definitionName: string }> {
  return test.step(
    "questionnaire.structured.chargeitem.create",
    async () => {
      const category = input.category ?? "Medications";
      const definitionName =
        input.definitionName ??
        faker.helpers.arrayElement(MEDICATION_CHARGE_ITEM_DEFINITIONS);
      await openQuestionnaireFillViaUi(page, { ...input, slug: "charge_item" });

      await page
        .getByRole("combobox")
        .filter({ hasText: "Select charge item definition" })
        .click();
      await page.getByText(category).click();
      await page.getByText(definitionName).click();

      await page.getByRole("button", { name: "Save Changes" }).click();
      await expect(page.getByText("Questionnaire submitted")).toBeVisible();
      return { definitionName };
    },
    { box: true },
  );
}

/** A procedure record as the procedure API returns it. */
export interface ProcedureRecord {
  id: string;
  status: string;
  outcome: string | null;
  note: string | null;
  code: { display: string };
  occurrence: { occurrence_string?: string | null };
  body_site: { display: string }[];
}

/** SNOMED codes for the procedures the specs seed through the API. */
export const PROCEDURE_SNOMED_CODES: Record<string, string> = {
  Colonoscopy: "73761001",
  "Total knee replacement": "609588000",
  "Caesarean section": "11466000",
  "Extraction of cataract": "54885007",
};

/**
 * Records a completed procedure on an encounter through the upsert API.
 * `display` must be a key of `PROCEDURE_SNOMED_CODES`.
 */
export async function createProcedureViaApi({
  patientId,
  encounterId,
  display,
  note,
}: {
  patientId: string;
  encounterId: string;
  display: string;
  note: string;
}): Promise<ProcedureRecord> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/patient/${patientId}/procedure/upsert/`,
    {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        datapoints: [
          {
            encounter: encounterId,
            status: "completed",
            code: {
              system: "http://snomed.info/sct",
              code: PROCEDURE_SNOMED_CODES[display],
              display,
            },
            occurrence: { occurrence_string: "Around 2015" },
            note,
          },
        ],
      }),
    },
  );
  if (!res.ok) throw new Error(`Failed to seed procedure: ${res.status}`);
  return ((await res.json()) as ProcedureRecord[])[0];
}
