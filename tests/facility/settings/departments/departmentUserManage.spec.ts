import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Department User Management", () => {
  // Tests share state (users in the same department) — run serially to avoid conflicts
  test.describe.configure({ mode: "serial" });

  let facilityId: string;

  const testUsers = ["care-volunteer"];

  const testRoles = ["Doctor", "Staff", "Facility Admin"];

  const departmentName = "Administration";

  // Each test links and unlinks the same user. Reset through the API so a
  // failure before the UI cleanup does not leave the user linked for retries.
  async function unlinkTestUsers() {
    const apiUrl = getApiUrl();
    const headers = getApiHeaders();
    const orgsUrl = `${apiUrl}/api/v1/facility/${facilityId}/organizations/`;
    const getJson = async <T>(url: string): Promise<T> => {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
      return (await res.json()) as T;
    };

    const orgs = await getJson<{ results: { id: string; name: string }[] }>(
      `${orgsUrl}?name=${encodeURIComponent(departmentName)}&limit=50`,
    );
    for (const org of orgs.results.filter((o) => o.name === departmentName)) {
      for (const username of testUsers) {
        const roles = await getJson<{
          results: { id: string; user: { username: string } }[];
        }>(
          `${orgsUrl}${org.id}/users/?search_text=${encodeURIComponent(username)}&limit=50`,
        );
        for (const role of roles.results) {
          if (role.user.username !== username) continue;
          const res = await fetch(`${orgsUrl}${org.id}/users/${role.id}/`, {
            method: "DELETE",
            headers,
          });
          if (!res.ok) {
            throw new Error(`Failed to unlink ${username}: ${res.status}`);
          }
        }
      }
    }
  }

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await unlinkTestUsers();
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
    await page.getByPlaceholder("Search Roles").fill(role);
    await page.getByRole("option", { name: role }).first().click();
  }

  async function submitAddUser(page: Page) {
    await page.getByRole("button", { name: "Add to Organization" }).click();
    // Wait for the success toast to confirm the operation completed
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("User added to organization successfully"),
    ).toBeVisible();
  }

  async function searchUserInTable(page: Page, userName: string) {
    await page
      .getByRole("textbox", { name: "Search by username" })
      .fill(userName);
  }

  function userCard(page: Page, userName: string) {
    return page.locator('[data-slot="card"]').filter({ hasText: userName });
  }

  async function verifyUserRole(page: Page, userName: string, role: string) {
    await expect(
      userCard(page, userName).getByText(role, { exact: true }),
    ).toBeVisible();
  }

  async function verifyUserInList(page: Page, userName: string) {
    await expect(userCard(page, userName)).toBeVisible();
  }

  async function openEditRoleDialog(page: Page, userName: string) {
    await userCard(page, userName)
      .getByRole("button", { name: "Edit", exact: true })
      .click();
  }

  async function updateRole(
    page: Page,
    userName: string,
    initialRole: string,
    newRole: string,
  ) {
    const sheet = page.getByRole("dialog", { name: "Edit User Role" });
    const save = sheet.getByRole("button", { name: "Update Role" });
    const pickNewRole = async () => {
      const picker = sheet.getByRole("combobox");
      await expect(picker).toHaveText(initialRole);
      await picker.click();
      await page.getByPlaceholder("Search Roles").fill(newRole);
      await page.getByRole("option", { name: newRole }).first().click();
    };
    await expect(save).toBeDisabled();
    await pickNewRole();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();
    await openEditRoleDialog(page, userName);
    await expect(save).toBeDisabled();
    await pickNewRole();
    await expect(
      page.getByRole("listbox", { name: "Suggestions" }),
    ).toBeHidden();
    await save.click();
    await expect(sheet).toBeHidden();
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

  test("Cancel linking user without assigning role", async ({ page }) => {
    const userName = faker.helpers.arrayElement(testUsers);

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

    // Navigate to department and open users tab
    await openFirstDepartment(page, departmentName);
    await navigateToUsersTab(page);

    // Link existing user to department
    await openLinkUserDialog(page);
    await selectUser(page, userName);
    await selectRole(page, role);
    await submitAddUser(page);

    // Verify user exists in department list
    await searchUserInTable(page, userName);
    await verifyUserInList(page, userName);
    await verifyUserRole(page, userName, role);

    // Cleanup: Remove user for rerun
    await openEditRoleDialog(page, userName);
    await removeUser(page);
    await verifyUserRemovalSuccess(page);
  });

  test("Update linked user role", async ({ page }) => {
    const userName = faker.helpers.arrayElement(testUsers);
    const initialRole = faker.helpers.arrayElement(testRoles);
    const updatedRole = faker.helpers.arrayElement(
      testRoles.filter((role) => role !== initialRole),
    );

    // Navigate to department and open users tab
    await openFirstDepartment(page, departmentName);
    await navigateToUsersTab(page);

    // Link user to department
    await openLinkUserDialog(page);
    await selectUser(page, userName);
    await selectRole(page, initialRole);
    await submitAddUser(page);

    // Search and verify user with initial role
    await searchUserInTable(page, userName);
    await verifyUserRole(page, userName, initialRole);

    // Update user role
    await openEditRoleDialog(page, userName);
    await updateRole(page, userName, initialRole, updatedRole);
    await verifyRoleUpdateSuccess(page);

    // Verify role was updated
    await searchUserInTable(page, userName);
    await verifyUserRole(page, userName, updatedRole);

    // Cleanup: Remove user for rerun
    await openEditRoleDialog(page, userName);
    await removeUser(page);
    await verifyUserRemovalSuccess(page);
  });

  test("Remove linked user from department", async ({ page }) => {
    const userName = faker.helpers.arrayElement(testUsers);
    const role = faker.helpers.arrayElement(testRoles);

    // Navigate to department and open users tab
    await openFirstDepartment(page, departmentName);
    await navigateToUsersTab(page);

    // Link user to department
    await openLinkUserDialog(page);
    await selectUser(page, userName);
    await selectRole(page, role);
    await submitAddUser(page);

    // Verify user is in list
    await searchUserInTable(page, userName);
    await verifyUserInList(page, userName);

    // Remove user from department
    await openEditRoleDialog(page, userName);
    await removeUser(page);
    await verifyUserRemovalSuccess(page);

    // Verify user is no longer in list
    await verifyUserNotInList(page);
  });
});
