import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Assign users to a patient", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
    await page.getByText("View Encounter").first().click();
    await navigateToPatientDetails(page);
  });

  async function navigateToPatientDetails(page: Page) {
    // Click the patient info hover card trigger to reveal the menu
    await page.getByRole("button", { name: /.*Y,.*/ }).click();

    // Wait for and click the View Profile link
    const viewProfileLink = page.getByRole("link", { name: "View Profile" });
    await viewProfileLink.waitFor({ state: "visible" });
    await viewProfileLink.click();
  }

  async function openUsersTab(page: Page) {
    await page.getByRole("tab", { name: "Users" }).click();
  }

  async function openAssignUserDialog(page: Page) {
    await page.getByRole("button", { name: "Assign User" }).click();
  }

  async function selectUser(page: Page, userName: string) {
    await page.getByRole("combobox").first().click();
    await page.locator("[cmdk-input]").fill(userName);
    await page.getByRole("option", { name: userName }).first().click();
  }

  async function selectRole(page: Page, role: string) {
    await page.getByRole("combobox").filter({ hasText: "Select Role" }).click();
    await page.getByRole("option", { name: role }).first().click();
  }

  async function submitAssignUser(page: Page) {
    await page.getByRole("button", { name: "Assign to Patient" }).click();
  }

  async function verifyUserAssignmentSuccess(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("User added to patient successfully"),
    ).toBeVisible({ timeout: 10000 });
  }

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

  test("Assign user to patient", async ({ page }) => {
    const userName = "Admin User";
    const userRole = "Nurse";

    // Navigate to users tab and assign user
    await openUsersTab(page);
    await openAssignUserDialog(page);
    await selectUser(page, userName);
    await selectRole(page, userRole);
    await submitAssignUser(page);
    await verifyUserAssignmentSuccess(page);

    // Verify user is in the list
    await verifyUserInList(page, userName);

    // Cleanup: Remove user
    await removeUser(page);
    await verifyUserRemovalSuccess(page);

    // Verify no users assigned message is visible
    await verifyNoUsersAssigned(page);
  });

  test("Cancel user assignment without selecting role", async ({ page }) => {
    const userName = "care-doctor";

    // Navigate to users tab and open assign dialog
    await openUsersTab(page);
    await openAssignUserDialog(page);
    await selectUser(page, userName);

    // Close dialog without selecting role by clicking the X button
    await page.getByRole("button", { name: "Close" }).click();

    // Verify no users assigned message is still visible (user was not added)
    await verifyNoUsersAssigned(page);
  });
});
