import { faker } from "@faker-js/faker";
import { getFieldErrorMessage } from "tests/helper/error";
import {
  type EncounterTarget,
  MEDICATION_DOSAGE_UNITS,
  MEDICATION_DURATION_UNITS,
  MEDICATION_FREQUENCIES,
  MEDICATION_INT_MAX,
  MEDICATION_OPTIONS,
  addMedicationRequestViaUi,
  selectMedication,
} from "tests/helper/structuredQuestions";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Medication Request Questionnaire", () => {
  let encounter: EncounterTarget;
  let questionnaireUrl: string;
  let medicationName: string;
  let dosageQuantity: number;
  let dosageUnit: string;
  let durationUnit: string;
  let duration: number;
  let frequencyData: { input: string; display: string };

  test.beforeEach(async ({ facilityId, isolatedEncounter }) => {
    const { patientId, encounterId } = isolatedEncounter;
    encounter = { facilityId, patientId, encounterId };
    medicationName = faker.helpers.arrayElement(MEDICATION_OPTIONS);
    dosageQuantity = faker.number.int(MEDICATION_INT_MAX);
    dosageUnit = faker.helpers.arrayElement(MEDICATION_DOSAGE_UNITS);
    frequencyData = faker.helpers.arrayElement(MEDICATION_FREQUENCIES);
    durationUnit = faker.helpers.arrayElement(MEDICATION_DURATION_UNITS);
    // min: 2 keeps us in the plural range — the new DurationInput renders
    // proper singulars ("1 day") which would break exact-match option lookups.
    duration = faker.number.int({ min: 2, max: MEDICATION_INT_MAX });

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/medication_request`;
  });

  test(
    "should add medication filling all fields and verify it appears in medication history",
    {
      tag: [
        "@atomic",
        "@cap:questionnaire.structured.medication-request.create",
      ],
    },
    async ({ page }) => {
      await addMedicationRequestViaUi(page, {
        ...encounter,
        medicationName,
        dosageQuantity,
        dosageUnit,
        frequency: frequencyData,
        duration,
        durationUnit,
        advanced: {},
      });

      await page.goto(questionnaireUrl);
      await page.getByRole("button", { name: "Medication History" }).click();

      const historyDialog = page.getByRole("dialog", {
        name: "Medication History",
      });
      await historyDialog.waitFor({ state: "visible" });
      const medicationRow = page
        .locator('[data-slot="table-body"] tr')
        .filter({ hasText: medicationName })
        .filter({ hasText: `${dosageQuantity} ${dosageUnit}` })
        .filter({ hasText: frequencyData.display })
        .filter({ hasText: `${duration} ${durationUnit}` });

      await expect(medicationRow).toBeVisible();
    },
  );

  test(
    "add medication with only required fields and verify it appears in medication history",
    {
      tag: [
        "@atomic",
        "@cap:questionnaire.structured.medication-request.create",
      ],
    },
    async ({ page }) => {
      await addMedicationRequestViaUi(page, {
        ...encounter,
        medicationName,
        dosageQuantity,
        dosageUnit,
        frequency: frequencyData,
        duration,
        durationUnit,
      });

      await page.goto(questionnaireUrl);
      await page.getByRole("button", { name: "Medication History" }).click();

      const historyDialog = page.getByRole("dialog", {
        name: "Medication History",
      });
      await historyDialog.waitFor({ state: "visible" });
      const medicationRow = page
        .locator('[data-slot="table-body"] tr')
        .filter({ hasText: medicationName })
        .filter({ hasText: `${dosageQuantity} ${dosageUnit}` })
        .filter({ hasText: frequencyData.display })
        .filter({ hasText: `${duration} ${durationUnit}` });

      await expect(medicationRow).toBeVisible();
    },
  );

  test(
    "should show validation errors when required fields are missing",
    {
      tag: [
        "@atomic",
        "@cap:questionnaire.structured.medication-request.create",
      ],
    },
    async ({ page }) => {
      await page.goto(questionnaireUrl);
      await page.waitForLoadState("networkidle");

      await selectMedication(page, medicationName);

      await page.getByRole("button", { name: "Save Changes" }).click();

      await expect(
        page.getByText("Dosage*This field is required"),
      ).toBeVisible();

      await expect(
        page.getByText("Frequency*eg. 1-0-1This field"),
      ).toBeVisible();
    },
  );

  test(
    "should reject whitespace-only input in required text fields",
    {
      tag: [
        "@atomic",
        "@cap:questionnaire.structured.medication-template.create",
      ],
    },
    async ({ page }) => {
      await page.goto(questionnaireUrl);

      // The response template form opens only when there is a medication to save.
      await test.step("Add a medication", async () => {
        await selectMedication(page, medicationName);
      });

      await test.step("Open the save template form", async () => {
        await page.getByRole("button", { name: /^Templates/ }).click();
        await page.getByRole("button", { name: /^Save Current/ }).click();
      });

      const templateSheet = page.getByRole("dialog", {
        name: "Save as Template",
      });
      const nameField = templateSheet.getByRole("textbox", {
        name: "Template Name",
      });
      await nameField.fill("   ");

      await templateSheet
        .getByRole("button", { name: "Create Template" })
        .click();

      // Text not asserted: this schema's message is resolved at module load,
      // before translations are ready, so it does not read "Name is required".
      await expect(getFieldErrorMessage(nameField)).toBeVisible();
    },
  );
});
