import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { permissions } from "tests/admin/roles/permissions";
import { getFieldErrorMessage } from "tests/helper/error";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

async function createRole(page: Page, roleName: string, description?: string) {
  await page.getByRole("button", { name: /Add Role/i }).click();
  await page.getByPlaceholder("Enter role name").fill(roleName);
  if (description) {
    await page.getByPlaceholder("Enter role description").fill(description);
  }
  await page.waitForLoadState("networkidle");
  // select all permissions
  await page.getByRole("button", { name: "Select All" }).click();
  await page.getByRole("button", { name: /Create Role/i }).click();

  // verify toast message
  await expectToast(page, "Role created successfully");
}

test.describe("Admin Roles Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/rbac/roles");
  });

  test("Create role without permissions and verify validation message", async ({
    page,
  }) => {
    const roleName = faker.person.jobTitle();
    await page.getByRole("button", { name: /Add Role/i }).click();
    await page.getByPlaceholder("Enter role name").fill(roleName);
    await page.getByRole("button", { name: /Create Role/i }).click();
    // verify form validation
    await expect(
      getFieldErrorMessage(page.getByLabel(/permissions.*\*/i)),
    ).toContainText("At least one permission is required");
  });

  test("Create Role with all permissions and verify", async ({ page }) => {
    const roleName = faker.person.jobTitle();
    const description = faker.lorem.sentence();
    const fake5permissions = faker.helpers.arrayElements(permissions, 5);
    await createRole(page, roleName, description);
    const tableBody = page.locator('[data-slot="table-body"]');

    // verify role in the list
    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await expect(tableBody).toContainText(roleName);

    // verify five random permissions are checked
    await page.getByRole("button", { name: /Edit/i }).click();
    for (let i = 0; i < fake5permissions.length; i++) {
      const permission = fake5permissions[i];
      await page.getByPlaceholder("Search permissions").fill(permission);
      await page.waitForLoadState("networkidle");
      await expect(page.getByLabel(permission).first()).toBeChecked();
    }
  });

  test("Edit Role and verify", async ({ page }) => {
    const roleName = faker.person.jobTitle();
    const description = faker.lorem.sentence();
    const uncheckedPermission = faker.helpers.arrayElement(permissions);
    await createRole(page, roleName, description);
    const tableBody = page.locator('[data-slot="table-body"]');

    // edit role name
    const updatedRoleName = `${roleName} - updated`;
    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await page.getByRole("button", { name: /Edit/i }).first().click();
    await page.getByPlaceholder("Enter role name").fill(updatedRoleName);

    await page.getByPlaceholder("Search permissions").fill(uncheckedPermission);
    await page.waitForLoadState("networkidle");
    await page.getByLabel(uncheckedPermission).first().uncheck();

    await page.getByRole("button", { name: /Update Role/i }).click();

    // verify toast message
    await expectToast(page, "Role updated successfully");

    // verify in the list
    await page
      .getByRole("textbox", { name: /Search Roles/i })
      .fill(updatedRoleName);
    await expect(tableBody).toContainText(updatedRoleName);
    await page.getByRole("button", { name: /Edit/i }).click();
    await page.getByPlaceholder("Search permissions").fill(uncheckedPermission);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByLabel(uncheckedPermission).first(),
    ).not.toBeChecked();
  });

  test("Clone Role and verify", async ({ page }) => {
    const roleName = faker.person.jobTitle();
    const description = faker.lorem.sentence();
    const clonedRoleName = `${roleName} (Copy)`;
    const tableBody = page.locator('[data-slot="table-body"]');
    await createRole(page, roleName, description);

    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await page.getByRole("button", { name: /Clone/i }).click();
    await page.getByRole("button", { name: /Create Role/i }).click();

    // verify toast message
    await expectToast(page, "Role created successfully");

    // verify cloned role in the list
    await page
      .getByRole("textbox", { name: /Search Roles/i })
      .fill(clonedRoleName);
    await expect(tableBody).toContainText(clonedRoleName);
  });
});
