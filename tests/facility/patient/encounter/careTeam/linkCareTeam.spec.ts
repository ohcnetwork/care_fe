import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  departmentCards,
  departmentTrigger,
} from "tests/helper/departmentSelect";
import {
  addCareTeamMemberViaUi,
  CARE_TEAM_TEST_ROLES,
  CARE_TEAM_TEST_USERNAMES,
  openCareTeamDialog,
  selectCareTeamMember,
  selectCareTeamRole,
} from "tests/helper/encounterCare";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Manage care team for an encounter", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let selectedRole: string;
  let selectedUsername: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    selectedUsername = faker.helpers.arrayElement(CARE_TEAM_TEST_USERNAMES);
    selectedRole = faker.helpers.arrayElement(CARE_TEAM_TEST_ROLES);
    // Each test gets its own encounter: on a shared one, a parallel test
    // adds or removes members while this test counts on them.
    ({ patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId));
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );
  });

  test.describe("Adding members", () => {
    test(
      "Add a care team member with role",
      { tag: ["@atomic", "@cap:encounter.careteam.assign"] },
      async ({ page }) => {
        await addCareTeamMemberViaUi(page, {
          facilityId,
          patientId,
          encounterId,
          userName: selectedUsername,
          role: selectedRole,
        });

        // The sheet stays open after adding.
        await test.step("Verify department selector", async () => {
          await expect(departmentTrigger(page)).toBeVisible();
          await expect(
            departmentCards(page).filter({ hasText: "Administration" }),
          ).toBeVisible();
        });

        await test.step("Verify member added", async () => {
          const dialog = page.getByRole("dialog", {
            name: "Manage Care Team",
          });
          await expect(dialog.getByText(selectedRole)).toBeVisible();
        });
      },
    );

    test(
      "Cannot add same member with same role twice",
      { tag: ["@atomic", "@cap:encounter.careteam.assign"] },
      async ({ page }) => {
        // Add member first time
        await addCareTeamMemberViaUi(page, {
          facilityId,
          patientId,
          encounterId,
          userName: selectedUsername,
          role: selectedRole,
        });

        await test.step("Try to add same member with same role again", async () => {
          await selectCareTeamMember(page, selectedUsername);
          await selectCareTeamRole(page, selectedRole);

          await page.getByRole("button", { name: "Add" }).click();
          await expectToast(page, /already added|already exists|duplicate/i);
        });
      },
    );
  });

  test(
    "Closing without clicking Add does not save care team member",
    { tag: ["@atomic", "@cap:encounter.careteam.assign"] },
    async ({ page }) => {
      await test.step("Open care team sheet", async () => {
        await openCareTeamDialog(page);
        await expect(
          departmentCards(page).filter({ hasText: "Administration" }),
        ).toBeVisible();
      });

      await test.step("Select member and role without adding", async () => {
        await selectCareTeamMember(page, selectedUsername);
        await selectCareTeamRole(page, selectedRole);
      });

      await test.step("Close sheet without clicking Add", async () => {
        await page.getByRole("button", { name: "Close" }).click();
        await expect(
          page.getByRole("dialog", { name: "Manage Care Team" }),
        ).toBeHidden();
      });

      await test.step("Verify member was not added", async () => {
        await openCareTeamDialog(page);

        const dialog = page.getByRole("dialog", { name: "Manage Care Team" });
        await expect(
          dialog.getByText(selectedUsername, { exact: true }),
        ).toBeHidden();
      });
    },
  );

  test(
    "Add button becomes enabled after selecting member and role",
    { tag: ["@atomic", "@cap:encounter.careteam.assign"] },
    async ({ page }) => {
      await test.step("Open care team sheet", async () => {
        await openCareTeamDialog(page);
      });

      await test.step("Verify Add button is initially disabled", async () => {
        await expect(page.getByRole("button", { name: "Add" })).toBeDisabled();
      });

      await test.step("Select member", async () => {
        await selectCareTeamMember(page, selectedUsername);
      });

      await test.step("Verify Add button is still disabled", async () => {
        await expect(page.getByRole("button", { name: "Add" })).toBeDisabled();
      });

      await test.step("Select role", async () => {
        await selectCareTeamRole(page, selectedRole);
      });

      await test.step("Verify Add button is now enabled", async () => {
        await expect(page.getByRole("button", { name: "Add" })).toBeEnabled();
      });
    },
  );
});
