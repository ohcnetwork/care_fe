import { expect, test, type Page } from "@playwright/test";
import {
  assignUserToPatientViaUi,
  openAssignUserDialog,
  openPatientUsersTab,
  selectUserToAssign,
} from "tests/helper/patient";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Assign users to a patient", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    ({ patientId } = await createQuestionnaireEncounter(facilityId));
    await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  });

  async function verifyUserInList(page: Page, userName: string) {
    await expect(page.getByText(userName).first()).toBeVisible();
  }

  async function removeUser(page: Page) {
    // Click the trash icon button
    await page
      .locator("button")
      .filter({ has: page.locator(".care-l-trash") })
      .first()
      .click();
    await page.getByRole("button", { name: "Remove" }).click();
  }

  async function verifyUserRemovalSuccess(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("User removed successfully"),
    ).toBeVisible({ timeout: 10000 });
  }

  async function verifyNoUsersAssigned(page: Page) {
    await expect(
      page.getByText("No User Assigned to this patient"),
    ).toBeVisible();
  }

  test(
    "Assign user to patient",
    { tag: ["@atomic", "@cap:patient.user.assign"] },
    async ({ page }) => {
      const userName = "Admin User";
      const userRole = "Nurse";

      // Navigate to users tab and assign user
      await assignUserToPatientViaUi(page, {
        facilityId,
        patientId,
        userName,
        role: userRole,
      });

      // Verify user is in the list
      await verifyUserInList(page, userName);

      // Cleanup: Remove user
      await removeUser(page);
      await verifyUserRemovalSuccess(page);

      // Verify no users assigned message is visible
      await verifyNoUsersAssigned(page);
    },
  );

  test(
    "Cancel user assignment without selecting role",
    { tag: ["@atomic", "@cap:patient.user.assign"] },
    async ({ page }) => {
      const userName = "care-doctor";

      // Navigate to users tab and open assign dialog
      await openPatientUsersTab(page);
      await openAssignUserDialog(page);
      await selectUserToAssign(page, userName);

      // Close dialog without selecting role by clicking the X button
      await page.getByRole("button", { name: "Close" }).click();

      // Verify no users assigned message is still visible (user was not added)
      await verifyNoUsersAssigned(page);
    },
  );
});
