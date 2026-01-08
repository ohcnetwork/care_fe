import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

async function createRole(page: Page, roleName: string, description?: string) {
  await page.getByRole("button", { name: /Add Role/i }).click();
  await page.getByPlaceholder("Enter role name").fill(roleName);
  if (description) {
    await page.getByPlaceholder("Enter role description").fill(description);
  }
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

    // verify create button is disabled initially
    await expect(
      page.getByRole("button", { name: /Create Role/i }),
    ).toBeDisabled();
    await page.getByPlaceholder("Enter role name").fill(roleName);
    await page.getByRole("button", { name: /Create Role/i }).click();
    // verify form validation
    await expect(
      getFieldErrorMessage(page.locator('div[data-slot="card"]')),
    ).toContainText("At least one permission is required");
  });

  test("Create Role with all permissions and verify in list", async ({
    page,
  }) => {
    const roleName = faker.person.jobTitle();
    const description = faker.lorem.sentence();
    await createRole(page, roleName, description);
    const tableBody = page.locator('[data-slot="table-body"]');

    // verify role in the list

    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await expect(tableBody).toContainText(roleName);
  });

  test("Create Role with all permissions and edit", async ({ page }) => {
    const roleName = faker.person.jobTitle();
    const description = faker.lorem.sentence();
    await createRole(page, roleName, description);
    const tableBody = page.locator('[data-slot="table-body"]');

    // edit role name

    const updatedRoleName = `${roleName} - updated`;
    await page.getByRole("textbox", { name: /Search Roles/i }).fill(roleName);
    await page.getByRole("button", { name: /Edit/i }).first().click();
    await page.getByPlaceholder("Enter role name").fill(updatedRoleName);

    await page.getByRole("button", { name: /Update Role/i }).click();

    // verify toast message

    await expectToast(page, "Role updated successfully");

    // verify in the list
    await page
      .getByRole("textbox", { name: /Search Roles/i })
      .fill(updatedRoleName);
    await expect(tableBody).toContainText(updatedRoleName);
  });
});
