import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { permissions } from "tests/admin/roles/permissions";
import { getFieldErrorMessage } from "tests/helper/error";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

async function createRole(
  page: Page,
  roleName: string,
  description?: string,
  permissions?: string[],
) {
  await page.getByRole("button", { name: /Add Role/i }).click();
  await page.getByPlaceholder("Enter role name").fill(roleName);
  if (description) {
    await page.getByPlaceholder("Enter role description").fill(description);
  }
  await page
    .getByRole("button", { name: "Select All" })
    .waitFor({ state: "visible" });

  if (permissions) {
    for (const permission of permissions) {
      await page.getByPlaceholder("Search permissions").fill(permission);
      await page
        .getByRole("button", { name: "Select All" })
        .waitFor({ state: "visible" });
      await page.getByLabel(permission).first().check();
    }
  } else {
    // select all permissions
    await page.getByRole("button", { name: "Select All" }).click();
  }

  await page.getByRole("button", { name: /Create Role/i }).click();

  // verify toast message
  await expectToast(page, "Role created successfully");
}

test.describe("Admin Roles Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/rbac/roles");
  });

  test("should show validation error when creating role without required fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Add Role/i }).click();
    await page.getByRole("button", { name: /Create Role/i }).click();
    // verify form validations
    await expect(
      getFieldErrorMessage(page.getByPlaceholder("Enter role name")),
    ).toContainText("This field is required");
    await expect(
      getFieldErrorMessage(page.locator('div[data-slot="card"]')),
    ).toContainText("At least one permission is required");
  });

  test("creates a role with all permissions and verifies assigned permissions", async ({
    page,
  }) => {
    const roleName = faker.person.jobTitle();
    const description = faker.lorem.sentence();
    const randomPermissions = faker.helpers.arrayElements(permissions, 5);
    await createRole(page, roleName, description);
    const tableBody = page.locator('[data-slot="table-body"]');

    // verify role in the list
    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await expect(tableBody).toContainText(roleName);

    // verify five random permissions are checked
    await page.getByRole("button", { name: /Edit/i }).click();
    for (const permission of randomPermissions) {
      await page.getByPlaceholder("Search permissions").fill(permission);
      await page
        .getByRole("button", { name: "Select All" })
        .waitFor({ state: "visible" });
      await expect(page.getByLabel(permission).first()).toBeChecked();
    }
  });

  test("updates an existing role by removing a permission and verifies the change", async ({
    page,
  }) => {
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
    await page
      .getByRole("button", { name: "Select All" })
      .waitFor({ state: "visible" });
    await page.getByLabel(uncheckedPermission).first().uncheck();

    await page.getByRole("button", { name: /Update Role/i }).click();

    // verify toast message
    await expectToast(page, "Role updated successfully");

    // verify in the list
    await page
      .getByRole("textbox", { name: /Search Roles/i })
      .fill(updatedRoleName);
    await expect(tableBody).toContainText(updatedRoleName);

    // verify unchecked permission
    await page.getByRole("button", { name: /Edit/i }).click();
    await page.getByPlaceholder("Search permissions").fill(uncheckedPermission);
    await page
      .getByRole("button", { name: "Select All" })
      .waitFor({ state: "visible" });
    await expect(
      page.getByLabel(uncheckedPermission).first(),
    ).not.toBeChecked();
  });

  test("clones an existing role and verifies newly added permissions", async ({
    page,
  }) => {
    const roleName = faker.person.jobTitle();
    const description = faker.lorem.sentence();
    const randomPermissions = faker.helpers.arrayElements(permissions, 3);
    const clonedRoleName = `${roleName} (Copy)`;
    const tableBody = page.locator('[data-slot="table-body"]');
    await createRole(page, roleName, description, randomPermissions);

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

    // verify three random permissions are checked
    await page.getByRole("button", { name: /Edit/i }).click();
    for (const permission of randomPermissions) {
      await page.getByPlaceholder("Search permissions").fill(permission);
      await page
        .getByRole("button", { name: "Select All" })
        .waitFor({ state: "visible" });
      await expect(page.getByLabel(permission).first()).toBeChecked();
    }
  });
});
