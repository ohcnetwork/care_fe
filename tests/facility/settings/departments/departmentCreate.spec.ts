import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Department/Team Creation", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/departments`);
  });

  async function openCreateOrganizationForm(page: Page) {
    await page
      .getByRole("button", { name: "Add Department/Team" })
      .first()
      .click();
  }

  async function fillOrganizationForm(
    page: Page,
    options: {
      name?: string;
      type?: "Department" | "Team";
      description?: string;
    },
  ) {
    if (options.name) {
      await page
        .getByRole("textbox", { name: "Name" })
        .pressSequentially(options.name);
    }

    if (options.type) {
      await page.getByRole("combobox", { name: "Type" }).click();
      await page.getByRole("option", { name: options.type }).first().click();
    }

    if (options.description) {
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(options.description);
    }
  }

  async function submitOrganizationForm(page: Page) {
    await page.getByRole("button", { name: "Create Organization" }).click();
  }

  async function verifyOrganizationCreated(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Organization created successfully"),
    ).toBeVisible({ timeout: 10000 });
  }

  async function createOrganization(
    page: Page,
    name: string,
    type: "Department" | "Team",
    description: string,
  ) {
    await openCreateOrganizationForm(page);
    await fillOrganizationForm(page, { name, type, description });
    await submitOrganizationForm(page);
    await verifyOrganizationCreated(page);
  }

  async function searchDepartment(page: Page, departmentName: string) {
    await page
      .getByRole("textbox", { name: "Search by department/team name" })
      .fill(departmentName);
  }

  async function searchAndOpenDepartment(page: Page, departmentName: string) {
    await searchDepartment(page, departmentName);
    await page.getByRole("row").filter({ hasText: departmentName }).click();
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

  test("Create a new department", async ({ page }) => {
    const departmentName = faker.word.words(2);
    const description = faker.lorem.sentence();

    await createOrganization(page, departmentName, "Department", description);

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
  });

  test("Create a department and then create a sub-department under it", async ({
    page,
  }) => {
    const departmentName = faker.word.words(2);
    const subDepartmentName = `Sub-${faker.word.words(2)}`;
    const description = faker.lorem.sentence();

    await createOrganization(page, departmentName, "Department", description);
    await searchAndOpenDepartment(page, departmentName);
    await createOrganization(
      page,
      subDepartmentName,
      "Department",
      description,
    );
    await verifyParentNodeInTree(page, departmentName);
  });

  test("Create a department and then create a sub-team under it", async ({
    page,
  }) => {
    const departmentName = faker.word.words(2);
    const subTeamName = `Team-${faker.word.words(2)}`;
    const description = faker.lorem.sentence();

    await createOrganization(page, departmentName, "Department", description);
    await searchAndOpenDepartment(page, departmentName);
    await createOrganization(page, subTeamName, "Team", description);
    await verifyParentNodeInTree(page, departmentName);
  });

  test("Create a department with only required name field", async ({
    page,
  }) => {
    const departmentName = faker.word.words(2);

    await openCreateOrganizationForm(page);
    await fillOrganizationForm(page, { name: departmentName });
    await submitOrganizationForm(page);
    await verifyOrganizationCreated(page);

    await searchAndOpenDepartment(page, departmentName);

    await expect(
      page.getByRole("heading", { name: departmentName }),
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="badge"]').getByText("Department"),
    ).toBeVisible();
  });

  test("Verify search functionality filters departments correctly", async ({
    page,
  }) => {
    const departmentName = faker.word.words(2);
    const description = faker.lorem.sentence();
    const nonExistentSearch = faker.string.uuid();

    await createOrganization(page, departmentName, "Department", description);
    await searchDepartment(page, departmentName);

    await expect(
      page.getByRole("row").filter({ hasText: departmentName }),
    ).toBeVisible();

    await searchDepartment(page, nonExistentSearch);

    await expect(
      page.getByRole("row").filter({ hasText: departmentName }),
    ).not.toBeVisible();
  });

  test("Verify cancel button discards department creation", async ({
    page,
  }) => {
    const departmentName = faker.word.words(2);
    const description = faker.lorem.sentence();

    await openCreateOrganizationForm(page);
    await fillOrganizationForm(page, {
      name: departmentName,
      type: "Department",
      description,
    });

    await page.getByRole("button", { name: "Cancel" }).click();
    await searchDepartment(page, departmentName);

    await expect(
      page.getByRole("row").filter({ hasText: departmentName }),
    ).not.toBeVisible();
  });
});
