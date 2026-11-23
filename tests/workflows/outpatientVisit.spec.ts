import { faker } from "@faker-js/faker";
import {
  changeEncounterStatusViaUi,
  createEncounterViaUi,
} from "tests/helper/encounter";
import { registerPatientViaUi } from "tests/helper/patient";
import {
  answerRespiratoryStatusRequired,
  openQuestionnaireFillViaUi,
  submitQuestionnaireViaUi,
} from "tests/helper/questionnaire";
import { questionBlock } from "tests/helper/questionnaireV2";
import {
  MEDICATION_INT_MAX,
  addDiagnosisViaUi,
  addMedicationRequestViaUi,
} from "tests/helper/structuredQuestions";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

import type { Diagnosis } from "../../src/types/emr/diagnosis/diagnosis";
import type { EncounterRead } from "../../src/types/emr/encounter/encounter";
import type { MedicationRequestRead } from "../../src/types/emr/medicationRequest/medicationRequest";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "an outpatient visit records vitals, a diagnosis and a prescription on a new patient's ambulatory encounter and completes it",
  { tag: ["@workflow", "@cap:workflow.outpatient-visit"] },
  async ({ page, facilityId }) => {
    test.slow();

    const { patientId } = await registerPatientViaUi(page, { facilityId });
    const { encounterId } = await createEncounterViaUi(page, {
      facilityId,
      patientId,
      encounterClass: "Ambulatory",
    });
    const encounter = { facilityId, patientId, encounterId };

    // Clinical assessment: the seeded respiratory status form, with a note
    // unique to this run so its response can be found on the encounter.
    const airEntryNote = `Air entry ${faker.string.alphanumeric(10)}`;
    await openQuestionnaireFillViaUi(page, {
      ...encounter,
      slug: "respiratory_status-v3",
    });
    await answerRespiratoryStatusRequired(page);
    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(airEntryNote);
    await submitQuestionnaireViaUi(page);

    await test.step("The assessment shows on the encounter", async () => {
      await page.waitForURL(/\/updates$/);
      await expect(page.getByText(airEntryNote)).toBeVisible();
    });

    const { diagnosisName } = await addDiagnosisViaUi(page, encounter);

    await test.step("The diagnosis shows on the encounter overview", async () => {
      await expect(
        page
          .getByRole("region", { name: "Diagnoses", exact: true })
          .getByRole("listitem")
          .filter({ has: page.getByText(diagnosisName, { exact: true }) }),
      ).toBeVisible();
    });

    // At least 2: the dosage unit option is looked up by its plural label.
    const medication = await addMedicationRequestViaUi(page, {
      ...encounter,
      dosageQuantity: faker.number.int({ min: 2, max: MEDICATION_INT_MAX }),
    });

    await test.step("The prescription shows in the encounter's medication history", async () => {
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/medication_request`,
      );
      await page.getByRole("button", { name: "Medication History" }).click();
      await expect(
        page.getByRole("dialog", { name: "Medication History" }),
      ).toBeVisible();
      await expect(
        page
          .locator('[data-slot="table-body"] tr')
          .filter({ hasText: medication.medicationName })
          .filter({ hasText: medication.dosage })
          .filter({ hasText: medication.frequency })
          .filter({ hasText: medication.duration }),
      ).toBeVisible();
    });

    // An ambulatory encounter completes straight from the Actions tab (only
    // an inpatient one has to be discharged first).
    await changeEncounterStatusViaUi(page, {
      ...encounter,
      status: "Completed",
    });

    await test.step("The encounter is completed in the header", async () => {
      await expect(
        page
          .getByRole("region", { name: "Encounter", exact: true })
          .getByRole("button", {
            name: "Status History: Completed",
            exact: true,
          }),
      ).toBeVisible();
    });

    await test.step("The completed encounter keeps its diagnosis and prescription", async () => {
      const headers = getApiHeaders();

      const encounterResponse = await page.request.get(
        `${getApiUrl()}/api/v1/encounter/${encounterId}/`,
        { headers },
      );
      await expect(encounterResponse).toBeOK();
      const completed: EncounterRead = await encounterResponse.json();
      expect(completed.status).toBe("completed");
      expect(completed.encounter_class).toBe("amb");
      expect(completed.period.end).toBeTruthy();

      const diagnosisResponse = await page.request.get(
        `${getApiUrl()}/api/v1/patient/${patientId}/diagnosis/?encounter=${encounterId}`,
        { headers },
      );
      await expect(diagnosisResponse).toBeOK();
      const diagnoses = (await diagnosisResponse.json()) as {
        results: Diagnosis[];
      };
      expect(
        diagnoses.results.map((diagnosis) => diagnosis.code.display),
      ).toContain(diagnosisName);

      const medicationResponse = await page.request.get(
        `${getApiUrl()}/api/v1/patient/${patientId}/medication/request/?encounter=${encounterId}`,
        { headers },
      );
      await expect(medicationResponse).toBeOK();
      const medicationRequests = (await medicationResponse.json()) as {
        results: MedicationRequestRead[];
      };
      expect(
        medicationRequests.results.map(
          (request) => request.medication?.display,
        ),
      ).toContain(medication.medicationName);
    });
  },
);
