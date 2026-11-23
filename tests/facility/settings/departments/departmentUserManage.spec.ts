import { expect, test, type Page } from "@playwright/test";
import {
  createDepartmentViaApi,
  createUserViaApi,
  linkUserToDepartmentViaUi,
  searchAndOpenDepartment,
} from "tests/helper/facilitySettings";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Department User Management", () => {
  let facilityId: string;
  // Each test links its own user to its own department, so the tests share
  // nothing and run in parallel. The roles are fixed, non-admin facility roles.
  let departmentName: string;
  let username: string;

  const linkRole = "Doctor";
  const updatedRole = "Staff";

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    ({ name: departmentName } = await createDepartmentViaApi({ facilityId }));
    ({ username } = await createUserViaApi({
      usernamePrefix: "dept-user",
    }));
    await page.goto(`/facility/${facilityId}/settings/departments`);
  });

  async function navigateToUsersTab(page: Page) {
    await page.getByRole("tab", { name: "Users" }).click();
  }

  async function openLinkUserDialog(page: Page) {
    await page.getByRole("button", { name: "Link User" }).click();
  }

  async function selectUser(page: Page, userName: string) {
    await page.getByRole("combobox").click();
    await page.locator("[cmdk-input]").fill(userName);
    await page.getByRole("option", { name: userName }).first().click();
  }

  async function searchUserInTable(page: Page, userName: string) {
    await page
      .getByRole("textbox", { name: "Search by username" })
      .fill(userName);
  }

  async function verifyUserRole(page: Page, role: string) {
    await expect(page.getByText(role, { exact: true })).toBeVisible();
  }

  async function verifyUserInList(page: Page, userName: string) {
    await expect(page.getByText(userName)).toBeVisible();
  }

  async function openEditRoleDialog(page: Page) {
    await page.getByRole("button", { name: "Edit" }).first().click();
  }

  async function updateRole(page: Page, newRole: string) {
    await page.getByRole("combobox").filter({ hasText: "Select Role" }).click();
    await page.getByPlaceholder("Search Roles").fill(newRole);
    await page.getByRole("option", { name: newRole }).first().click();
    await page.getByRole("button", { name: "Update Role" }).click();
  }

  async function verifyRoleUpdateSuccess(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("User role updated successfully"),
    ).toBeVisible();
  }

  async function removeUser(page: Page) {
    await page.getByRole("button", { name: "Remove User" }).click();
    await page.getByRole("button", { name: "Remove" }).click();
  }

  async function verifyUserRemovalSuccess(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("User removed from organization successfully"),
    ).toBeVisible();
  }

  async function closeDialog(page: Page) {
    await page.getByText("Close", { exact: true }).click();
  }

  async function verifyUserNotInList(page: Page) {
    await expect(page.getByText("No Users Found")).toBeVisible();
  }

  test(
    "Cancel linking user without assigning role",
    { tag: ["@atomic", "@cap:department.user.link"] },
    async ({ page }) => {
      // Navigate to department and open users tab
      await searchAndOpenDepartment(page, departmentName);
      await navigateToUsersTab(page);

      // Open link user dialog and select user but don't select role
      await openLinkUserDialog(page);
      await selectUser(page, username);

      // Close dialog without submitting
      await closeDialog(page);

      // Verify user was not added to department
      await searchUserInTable(page, username);
      await verifyUserNotInList(page);
    },
  );

  test(
    "Link user and verify they appear in list",
    { tag: ["@atomic", "@cap:department.user.link"] },
    async ({ page }) => {
      // Link the user to the department from its users tab
      await linkUserToDepartmentViaUi(page, {
        facilityId,
        departmentName,
        username,
        role: linkRole,
      });

      // Verify user exists in department list
      await searchUserInTable(page, username);
      await verifyUserInList(page, username);
      await verifyUserRole(page, linkRole);

      // Cleanup: Remove user for rerun
      await openEditRoleDialog(page);
      await removeUser(page);
      await verifyUserRemovalSuccess(page);
    },
  );

  test(
    "Update linked user role",
    { tag: ["@atomic", "@cap:department.user.role.edit"] },
    async ({ page }) => {
      // Link user to department
      await linkUserToDepartmentViaUi(page, {
        facilityId,
        departmentName,
        username,
        role: linkRole,
      });

      // Search and verify user with initial role
      await searchUserInTable(page, username);
      await verifyUserRole(page, linkRole);

      // Update user role
      await openEditRoleDialog(page);
      await updateRole(page, updatedRole);
      await verifyRoleUpdateSuccess(page);

      // Verify role was updated
      await searchUserInTable(page, username);
      await verifyUserRole(page, updatedRole);

      // Cleanup: Remove user for rerun
      await openEditRoleDialog(page);
      await removeUser(page);
      await verifyUserRemovalSuccess(page);
    },
  );

  test(
    "Remove linked user from department",
    { tag: ["@atomic", "@cap:department.user.unlink"] },
    async ({ page }) => {
      // Link user to department
      await linkUserToDepartmentViaUi(page, {
        facilityId,
        departmentName,
        username,
        role: linkRole,
      });

      // Verify user is in list
      await searchUserInTable(page, username);
      await verifyUserInList(page, username);

      // Remove user from department
      await openEditRoleDialog(page);
      await removeUser(page);
      await verifyUserRemovalSuccess(page);

      // Verify user is no longer in list
      await verifyUserNotInList(page);
    },
  );
});
