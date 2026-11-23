import { expect, test } from "@playwright/test";
import {
  encounterDepartmentRow,
  encounterDepartmentsDialog,
  linkEncounterDepartmentViaUi,
  unlinkEncounterDepartmentViaUi,
} from "tests/helper/encounter";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Manage departments/teams association to an encounter", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;

  // Each test gets its own encounter. Other specs create in-progress
  // encounters without departments, so "the first encounter in the list"
  // may have nothing to remove.
  test.beforeEach(async () => {
    facilityId = getFacilityId();
    ({ patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId));
  });

  test(
    "Delete organization from encounter",
    { tag: ["@atomic", "@cap:encounter.department.unlink"] },
    async ({ page, request }) => {
      const name = `Encounter department ${Date.now()}`;
      const created = await request.post(
        `${apiBaseUrl()}/api/v1/facility/${facilityId}/organizations/`,
        {
          headers: adminApiHeaders(),
          data: { name, org_type: "dept", facility: facilityId },
        },
      );
      expect(created.ok(), await created.text()).toBe(true);
      const organization = (await created.json()) as { id: string };
      const linked = await request.post(
        `${apiBaseUrl()}/api/v1/encounter/${encounterId}/organizations_add/`,
        {
          headers: adminApiHeaders(),
          data: { organization: organization.id },
        },
      );
      expect(linked.ok(), await linked.text()).toBe(true);

      await unlinkEncounterDepartmentViaUi(page, {
        facilityId,
        patientId,
        encounterId,
        departmentName: name,
      });
      await expect(encounterDepartmentRow(page, name)).toHaveCount(0);
      await expect(
        encounterDepartmentsDialog(page).getByText(
          "No organizations added yet",
        ),
      ).toBeVisible();
    },
  );

  test(
    "Add additional organization to existing encounter",
    { tag: ["@atomic", "@cap:encounter.department.link"] },
    async ({ page }) => {
      await linkEncounterDepartmentViaUi(page, {
        facilityId,
        patientId,
        encounterId,
      });
    },
  );
});
