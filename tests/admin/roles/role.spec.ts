import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { permissions } from "tests/admin/roles/permissions";
import { getFieldErrorMessage } from "tests/helper/error";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

const DEFAULT_ROLE_CONTEXTS = [
  "Facility",
  "Government Organization",
  "Responsibility",
];
async function createRole(
  page: Page,
  roleName: string,
  description?: string,
  permissions?: string[],
  contexts: string[] = DEFAULT_ROLE_CONTEXTS,
) {
  await page.getByRole("button", { name: /Add Role/i }).click();
  await page.getByPlaceholder("Enter role name").fill(roleName);
  if (description) {
    await page.getByPlaceholder("Enter role description").fill(description);
  }
  await page
    .getByRole("button", { name: "Select All" })
    .waitFor({ state: "visible" });

  for (const context of contexts) {
    const contextElement = page.getByRole("checkbox", {
      name: context,
      exact: true,
    });
    if (await contextElement.isChecked()) {
      continue;
    }
    await contextElement.click();
  }

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
  await page.getByRole("button", { name: "Close toast" }).click();
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
    const permissionsError = page
      .locator('[data-slot="form-item"]')
      .filter({ has: page.getByText("Permissions") })
      .locator('[data-slot="form-message"]');
    await permissionsError.scrollIntoViewIfNeeded();
    await expect(permissionsError).toContainText(
      "At least one permission is required",
    );
  });

  test("creates a role with all permissions and verifies assigned permissions", async ({
    page,
  }) => {
    const roleName = faker.person.jobTitle();
    const description = faker.lorem.sentence();
    const randomPermissions = faker.helpers.arrayElements(permissions, 5);
    await createRole(page, roleName, description);

    // verify role in the list
    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await expect(page.getByRole("heading", { name: roleName })).toBeVisible();

    // verify five random permissions are checked
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: /Edit/i }).click();
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

    // edit role name
    const updatedRoleName = `${roleName} - updated`;
    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await page.getByRole("button", { name: "Actions" }).first().click();
    await page.getByRole("menuitem", { name: /Edit/i }).click();
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
    await expect(
      page.getByRole("heading", { name: updatedRoleName }),
    ).toBeVisible();

    // verify unchecked permission
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: /Edit/i }).click();
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
    await createRole(page, roleName, description, randomPermissions);

    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: /Clone/i }).click();
    await page.getByRole("button", { name: /Create Role/i }).click();

    // verify toast message
    await expectToast(page, "Role created successfully");

    // verify cloned role in the list
    await page
      .getByRole("textbox", { name: /Search Roles/i })
      .fill(clonedRoleName);
    await expect(
      page.getByRole("heading", { name: clonedRoleName }),
    ).toBeVisible();

    // verify three random permissions are checked
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: /Edit/i }).click();
    for (const permission of randomPermissions) {
      await page.getByPlaceholder("Search permissions").fill(permission);
      await page
        .getByRole("button", { name: "Select All" })
        .waitFor({ state: "visible" });
      await expect(page.getByLabel(permission).first()).toBeChecked();
    }
  });
});
