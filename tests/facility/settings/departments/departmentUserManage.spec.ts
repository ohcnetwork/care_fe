import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Department User Management", () => {
  let facilityId: string;

  const testUsers = ["care-doctor", "care-volunteer"];

  const testRoles = ["Doctor", "Staff", "Admin"];

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/departments`);
  });

  async function searchDepartment(page: Page, departmentName: string) {
    await page
      .getByRole("textbox", { name: "Search by department/team name" })
      .fill(departmentName);
  }

  async function openFirstDepartment(page: Page, departmentName: string) {
    await searchDepartment(page, departmentName);
    await page.getByRole("row").filter({ hasText: departmentName }).click();
  }

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

  async function selectRole(page: Page, role: string) {
    await page.getByRole("combobox").filter({ hasText: "Select Role" }).click();
    await page.getByRole("option", { name: role }).first().click();
  }

  async function submitAddUser(page: Page) {
    await page.getByRole("button", { name: "Add to Organization" }).click();
  }

  async function verifyUserAddedSuccess(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("User added to organization successfully"),
    ).toBeVisible({ timeout: 10000 });
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
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: newRole }).first().click();
    await page.getByRole("button", { name: "Update Role" }).click();
  }

  async function verifyRoleUpdateSuccess(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("User role updated successfully"),
    ).toBeVisible({ timeout: 10000 });
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
    ).toBeVisible({ timeout: 10000 });
  }

  async function closeDialog(page: Page) {
    await page.getByText("Close", { exact: true }).click();
  }

  async function verifyUserNotInList(page: Page) {
    await expect(page.getByText("No Users Found")).toBeVisible();
  }

  test("Cancel linking user without assigning role", async ({ page }) => {
    const userName = faker.helpers.arrayElement(testUsers);
    const departmentName = "Administration";

    // Navigate to department and open users tab
    await openFirstDepartment(page, departmentName);
    await navigateToUsersTab(page);

    // Open link user dialog and select user but don't select role
    await openLinkUserDialog(page);
    await selectUser(page, userName);

    // Close dialog without submitting
    await closeDialog(page);

    // Verify user was not added to department
    await searchUserInTable(page, userName);
    await verifyUserNotInList(page);
  });

  test("Link user and verify they appear in list", async ({ page }) => {
    const userName = faker.helpers.arrayElement(testUsers);
    const role = faker.helpers.arrayElement(testRoles);
    const departmentName = "Administration";

    // Navigate to department and open users tab
    await openFirstDepartment(page, departmentName);
    await navigateToUsersTab(page);

    // Link existing user to department
    await openLinkUserDialog(page);
    await selectUser(page, userName);
    await selectRole(page, role);
    await submitAddUser(page);
    await verifyUserAddedSuccess(page);

    // Verify user exists in department list
    await searchUserInTable(page, userName);
    await verifyUserInList(page, userName);
    await verifyUserRole(page, role);

    // Cleanup: Remove user for rerun
    await openEditRoleDialog(page);
    await removeUser(page);
    await verifyUserRemovalSuccess(page);
  });

  test("Update linked user role", async ({ page }) => {
    const userName = faker.helpers.arrayElement(testUsers);
    const initialRole = faker.helpers.arrayElement(testRoles);
    const updatedRole = faker.helpers.arrayElement(
      testRoles.filter((role) => role !== initialRole),
    );
    const departmentName = "Administration";

    // Navigate to department and open users tab
    await openFirstDepartment(page, departmentName);
    await navigateToUsersTab(page);

    // Link user to department
    await openLinkUserDialog(page);
    await selectUser(page, userName);
    await selectRole(page, initialRole);
    await submitAddUser(page);
    await verifyUserAddedSuccess(page);

    // Search and verify user with initial role
    await searchUserInTable(page, userName);
    await verifyUserRole(page, initialRole);

    // Update user role
    await openEditRoleDialog(page);
    await updateRole(page, updatedRole);
    await verifyRoleUpdateSuccess(page);

    // Verify role was updated
    await searchUserInTable(page, userName);
    await verifyUserRole(page, updatedRole);

    // Cleanup: Remove user for rerun
    await openEditRoleDialog(page);
    await removeUser(page);
    await verifyUserRemovalSuccess(page);
  });

  test("Remove linked user from department", async ({ page }) => {
    const userName = faker.helpers.arrayElement(testUsers);
    const role = faker.helpers.arrayElement(testRoles);
    const departmentName = "Administration";

    // Navigate to department and open users tab
    await openFirstDepartment(page, departmentName);
    await navigateToUsersTab(page);

    // Link user to department
    await openLinkUserDialog(page);
    await selectUser(page, userName);
    await selectRole(page, role);
    await submitAddUser(page);
    await verifyUserAddedSuccess(page);

    // Verify user is in list
    await searchUserInTable(page, userName);
    await verifyUserInList(page, userName);

    // Remove user from department
    await openEditRoleDialog(page);
    await removeUser(page);
    await verifyUserRemovalSuccess(page);

    // Verify user is no longer in list
    await verifyUserNotInList(page);
  });
});
