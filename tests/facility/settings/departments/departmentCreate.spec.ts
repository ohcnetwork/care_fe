import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  createDepartmentViaUi,
  fillDepartmentForm,
  openDepartmentForm,
  searchAndOpenDepartment,
} from "tests/helper/facilitySettings";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Department/Team Creation", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/departments`);
  });

  async function searchDepartment(page: Page, departmentName: string) {
    await page
      .getByRole("textbox", { name: "Search by department/team name" })
      .fill(departmentName);
  }

  async function verifyParentNodeInTree(page: Page, departmentName: string) {
    const parentNode = page
      .locator(".space-y-1 .flex.items-center span.truncate")
      .filter({ hasText: departmentName });

    await parentNode.scrollIntoViewIfNeeded();
    await expect(parentNode).toBeVisible();
    await parentNode.click();
    await expect(
      page.getByRole("heading", { name: departmentName }),
    ).toBeVisible();
  }

  test(
    "Create a new department",
    { tag: ["@atomic", "@cap:department.create"] },
    async ({ page }) => {
      const departmentName = faker.word.words(2);
      const description = faker.lorem.sentence();

      await createDepartmentViaUi(page, {
        facilityId,
        name: departmentName,
        type: "Department",
        description,
      });

      // Verify the department is created and visible in the list
      await searchAndOpenDepartment(page, departmentName);

      // Verify the department details are displayed
      await expect(
        page.getByRole("heading", { name: departmentName }),
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="badge"]').getByText("Department"),
      ).toBeVisible();
      await expect(page.getByText(description)).toBeVisible();
    },
  );

  test(
    "Create a department and then create a sub-department under it",
    { tag: ["@atomic", "@cap:department.sub-department.create"] },
    async ({ page }) => {
      const departmentName = faker.word.words(2);
      const subDepartmentName = `Sub-${faker.word.words(2)}`;
      const description = faker.lorem.sentence();

      await createDepartmentViaUi(page, {
        facilityId,
        name: departmentName,
        type: "Department",
        description,
      });
      await createDepartmentViaUi(page, {
        facilityId,
        name: subDepartmentName,
        type: "Department",
        description,
        parentDepartmentName: departmentName,
      });
      await verifyParentNodeInTree(page, departmentName);
    },
  );

  test(
    "Create a department and then create a sub-team under it",
    { tag: ["@atomic", "@cap:department.sub-team.create"] },
    async ({ page }) => {
      const departmentName = faker.word.words(2);
      const subTeamName = `Team-${faker.word.words(2)}`;
      const description = faker.lorem.sentence();

      await createDepartmentViaUi(page, {
        facilityId,
        name: departmentName,
        type: "Department",
        description,
      });
      await createDepartmentViaUi(page, {
        facilityId,
        name: subTeamName,
        type: "Team",
        description,
        parentDepartmentName: departmentName,
      });
      await verifyParentNodeInTree(page, departmentName);
    },
  );

  test(
    "Create a department with only required name field",
    { tag: ["@atomic", "@cap:department.create"] },
    async ({ page }) => {
      const departmentName = faker.word.words(2);

      await createDepartmentViaUi(page, { facilityId, name: departmentName });

      await searchAndOpenDepartment(page, departmentName);

      await expect(
        page.getByRole("heading", { name: departmentName }),
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="badge"]').getByText("Department"),
      ).toBeVisible();
    },
  );

  test(
    "Verify search functionality filters departments correctly",
    { tag: ["@atomic", "@cap:department.search"] },
    async ({ page }) => {
      const departmentName = faker.word.words(2);
      const description = faker.lorem.sentence();
      const nonExistentSearch = faker.string.uuid();

      await createDepartmentViaUi(page, {
        facilityId,
        name: departmentName,
        type: "Department",
        description,
      });
      await searchDepartment(page, departmentName);

      await expect(
        page.getByRole("row").filter({ hasText: departmentName }),
      ).toBeVisible();

      await searchDepartment(page, nonExistentSearch);

      await expect(
        page.getByRole("row").filter({ hasText: departmentName }),
      ).toBeHidden();
    },
  );

  test(
    "Verify cancel button discards department creation",
    { tag: ["@atomic", "@cap:department.create"] },
    async ({ page }) => {
      const departmentName = faker.word.words(2);
      const description = faker.lorem.sentence();

      await openDepartmentForm(page);
      await fillDepartmentForm(page, {
        name: departmentName,
        type: "Department",
        description,
      });

      await page.getByRole("button", { name: "Cancel" }).click();
      await searchDepartment(page, departmentName);

      await expect(
        page.getByRole("row").filter({ hasText: departmentName }),
      ).toBeHidden();
    },
  );
});
