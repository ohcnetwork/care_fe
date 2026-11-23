import { faker } from "@faker-js/faker";
import {
  collectSpecimenViaUi,
  createDiagnosticReportViaUi,
  createLabActivityDefinitionViaApi,
  createServiceRequestViaUi,
  enterDiagnosticResultsViaUi,
  openServiceRequestDetails,
} from "tests/facility/patient/encounter/serviceRequests/serviceRequest";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

import type { DiagnosticReportRead } from "../../src/types/emr/diagnosticReport/diagnosticReport";
import type { QuestionType } from "../../src/types/emr/observationDefinition/observationDefinition";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "a lab order moves from service request through specimen collection to a saved result",
  { tag: ["@workflow", "@cap:workflow.lab-order-to-result"] },
  async ({ page, facilityId, isolatedEncounter }) => {
    test.slow();
    const { patientId, encounterId } = isolatedEncounter;

    // An active copy of the seeded Urinalysis lab test. Its observation takes
    // a string: the fixture's own is a choice, which has no free-text result.
    const { activityTitle, observationTitle } =
      await createLabActivityDefinitionViaApi({
        facilityId,
        observation: { permitted_data_type: "string" as QuestionType },
      });

    const { activityDefinition } = await createServiceRequestViaUi(page, {
      facilityId,
      patientId,
      encounterId,
      activityDefinition: activityTitle,
    });
    await openServiceRequestDetails(page, activityDefinition);
    await collectSpecimenViaUi(page);
    const { diagnosticReportId } = await createDiagnosticReportViaUi(page);

    const resultValue = `${faker.number.int({ min: 10, max: 999 })}`;
    await enterDiagnosticResultsViaUi(page, { value: resultValue });

    await test.step("The saved result shows on the reopened service request", async () => {
      await page.reload();
      const observationGroup = page.getByRole("group", {
        name: observationTitle,
        exact: true,
      });
      await expect(
        observationGroup.getByRole("textbox", {
          name: observationTitle,
          exact: true,
        }),
      ).toHaveValue(resultValue);
    });

    await test.step("The diagnostic report holds the result for this encounter", async () => {
      const response = await page.request.get(
        `${getApiUrl()}/api/v1/patient/${patientId}/diagnostic_report/${diagnosticReportId}/`,
        { headers: getApiHeaders() },
      );
      await expect(response).toBeOK();
      const report: DiagnosticReportRead = await response.json();
      expect(report.encounter.id).toBe(encounterId);
      expect(
        report.observations.map((observation) => observation.value.value),
      ).toContain(resultValue);
    });
  },
);
