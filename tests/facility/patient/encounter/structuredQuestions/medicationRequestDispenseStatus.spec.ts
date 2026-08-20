import { expect, test, type Page } from "@playwright/test";
import {
  findMedicationCode,
  findTemplateIdByName,
  getTemplateMedications,
  listMedicationRequests,
  seedDispensedMedicationRequest,
  seedTemplateWithDispensedMedication,
  type MedicationCode,
} from "tests/facility/patient/encounter/structuredQuestions/medicationRequestApi";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * `dispense_status` belongs to the pharmacy. Only a dispense action sets it.
 * A new medication request must always start with an empty `dispense_status`,
 * even when the user copies it from a record that the pharmacy dispensed.
 *
 * Each test uses its own medication, so the tests can run in parallel against
 * the same patient and encounter.
 */

/** One medication per add path, to keep the assertions independent. */
const MEDICATIONS = {
  history: "Senna 15 mg oral tablet",
  templateMedication: "Zinc 50 mg oral capsule",
  templateApply: "Doxepin 3 mg oral tablet",
  saveTemplate: "Mesna 400 mg oral tablet",
} as const;

async function openMedicationQuestionnaire(
  page: Page,
  facilityId: string,
  patientId: string,
  encounterId: string,
) {
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/medication_request`,
  );
  await page.waitForLoadState("networkidle");
}

/** Adds a past prescription through the "Medication History" sheet. */
async function addFromMedicationHistory(page: Page, medicationName: string) {
  await page.getByRole("button", { name: "Medication History" }).click();

  const sheet = page.getByRole("dialog", { name: "Medication History" });
  await sheet.waitFor({ state: "visible" });
  await sheet.getByRole("tab", { name: "Past Prescriptions" }).click();

  const row = sheet.locator("tbody tr").filter({ hasText: medicationName });
  await expect(row.first()).toBeVisible();
  await row.first().getByRole("checkbox").check();

  await sheet.getByRole("button", { name: "Add Selected" }).click();
  await sheet.waitFor({ state: "hidden" });
}

/** Opens the response templates sheet and expands the given template. */
async function openTemplate(page: Page, templateName: string) {
  await page.getByRole("button", { name: "Templates" }).click();

  const sheet = page.getByRole("dialog", { name: "Response Templates" });
  await sheet.waitFor({ state: "visible" });
  await sheet.getByPlaceholder("Search templates").fill(templateName);
  await expect(sheet.getByText(templateName, { exact: true })).toBeVisible();

  return sheet;
}

async function submitQuestionnaire(page: Page) {
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expectToast(page, /questionnaire submitted successfully/i);
}

/**
 * Asserts that the encounter holds a medication request for the code that the
 * questionnaire created, and that its `dispense_status` is empty.
 * `knownIds` holds the records that existed before the questionnaire ran.
 */
async function expectNewRequestWithoutDispenseStatus(
  patientId: string,
  encounterId: string,
  medication: MedicationCode,
  knownIds: Set<string>,
) {
  const newRequests = async () => {
    const requests = await listMedicationRequests(
      patientId,
      encounterId,
      medication.code,
    );
    return requests.filter((request) => !knownIds.has(request.id));
  };

  await expect
    .poll(async () => (await newRequests()).length, {
      message: "The questionnaire did not create a medication request",
    })
    .toBeGreaterThan(0);

  for (const request of await newRequests()) {
    expect(
      request.dispense_status,
      "A new medication request must not copy the dispense status",
    ).toBeFalsy();
  }
}

/** Returns the ids of the medication requests that already exist. */
async function existingRequestIds(
  patientId: string,
  encounterId: string,
  medication: MedicationCode,
): Promise<Set<string>> {
  const requests = await listMedicationRequests(
    patientId,
    encounterId,
    medication.code,
  );
  return new Set(requests.map((request) => request.id));
}

test.describe("Medication Request dispense status", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
  });

  test("does not copy the dispense status of a past prescription", async ({
    page,
  }) => {
    const medication = await findMedicationCode(MEDICATIONS.history);
    let knownIds = new Set<string>();

    await test.step("Seed a dispensed prescription", async () => {
      await seedDispensedMedicationRequest(patientId, encounterId, medication);
      knownIds = await existingRequestIds(patientId, encounterId, medication);
    });

    await test.step("Add the prescription again from the history", async () => {
      await openMedicationQuestionnaire(
        page,
        facilityId,
        patientId,
        encounterId,
      );
      await addFromMedicationHistory(page, medication.display);
      await submitQuestionnaire(page);
    });

    await test.step("Verify the new request has no dispense status", async () => {
      await expectNewRequestWithoutDispenseStatus(
        patientId,
        encounterId,
        medication,
        knownIds,
      );
    });
  });

  test("does not copy the dispense status of a single template medication", async ({
    page,
  }) => {
    const medication = await findMedicationCode(MEDICATIONS.templateMedication);
    const templateName = `PW Dispensed Medication ${Date.now()}`;
    let knownIds = new Set<string>();

    await test.step("Seed a template that holds a dispensed medication", async () => {
      await seedTemplateWithDispensedMedication(
        facilityId,
        templateName,
        medication,
        encounterId,
      );
      knownIds = await existingRequestIds(patientId, encounterId, medication);
    });

    await test.step("Add the template medication to the questionnaire", async () => {
      await openMedicationQuestionnaire(
        page,
        facilityId,
        patientId,
        encounterId,
      );

      const sheet = await openTemplate(page, templateName);
      await sheet.getByText(templateName, { exact: true }).click();
      await sheet
        .getByRole("button")
        .filter({ hasText: medication.display })
        .click();
      await expectToast(page, /medication added/i);

      await page.keyboard.press("Escape");
      await sheet.waitFor({ state: "hidden" });
      await submitQuestionnaire(page);
    });

    await test.step("Verify the new request has no dispense status", async () => {
      await expectNewRequestWithoutDispenseStatus(
        patientId,
        encounterId,
        medication,
        knownIds,
      );
    });
  });

  test("does not copy the dispense status when a template is applied", async ({
    page,
  }) => {
    const medication = await findMedicationCode(MEDICATIONS.templateApply);
    const templateName = `PW Dispensed Template ${Date.now()}`;
    let knownIds = new Set<string>();

    await test.step("Seed a template that holds a dispensed medication", async () => {
      await seedTemplateWithDispensedMedication(
        facilityId,
        templateName,
        medication,
        encounterId,
      );
      knownIds = await existingRequestIds(patientId, encounterId, medication);
    });

    await test.step("Apply the template to the questionnaire", async () => {
      await openMedicationQuestionnaire(
        page,
        facilityId,
        patientId,
        encounterId,
      );

      const sheet = await openTemplate(page, templateName);
      await sheet.getByRole("button", { name: "Apply", exact: true }).click();
      await expectToast(page, /applied 1 medication/i);

      await page.keyboard.press("Escape");
      await sheet.waitFor({ state: "hidden" });
      await submitQuestionnaire(page);
    });

    await test.step("Verify the new request has no dispense status", async () => {
      await expectNewRequestWithoutDispenseStatus(
        patientId,
        encounterId,
        medication,
        knownIds,
      );
    });
  });

  test("does not store the dispense status in a new template", async ({
    page,
  }) => {
    const medication = await findMedicationCode(MEDICATIONS.saveTemplate);
    const templateName = `PW Saved Medication ${Date.now()}`;

    await test.step("Seed a dispensed prescription", async () => {
      await seedDispensedMedicationRequest(patientId, encounterId, medication);
    });

    await test.step("Save the medication into a new template", async () => {
      await openMedicationQuestionnaire(
        page,
        facilityId,
        patientId,
        encounterId,
      );
      await addFromMedicationHistory(page, medication.display);

      const row = page
        .locator('[id^="question-"]')
        .getByRole("button", { name: "Medication actions" })
        .first();
      await row.click();
      await page.getByRole("menuitem", { name: "Add to template" }).click();

      const dialog = page.getByRole("dialog", { name: "Add to template" });
      await dialog.waitFor({ state: "visible" });
      await dialog
        .getByRole("button", { name: /Create New Template/i })
        .click();

      // The dialog title changes once the create form opens, so the locator
      // above no longer matches. Target the name field by its stable id.
      await page.locator("#new-template-name").fill(templateName);
      await page
        .getByRole("button", { name: "Create Template", exact: true })
        .click();
      await expectToast(page, /created with medication/i);
    });

    await test.step("Verify the template holds no dispense status", async () => {
      const templateId = await findTemplateIdByName(facilityId, templateName);
      expect(templateId, "The template was not created").not.toBeNull();

      const medications = await getTemplateMedications(templateId!);
      expect(medications.length).toBeGreaterThan(0);

      for (const stored of medications) {
        expect(
          stored.dispense_status,
          "A template must not store the dispense status",
        ).toBeFalsy();
      }
    });
  });
});
