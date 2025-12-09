import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Prevent Creating Sub-Department/Team Under Administration", () => {
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

  async function openDepartment(page: Page, departmentName: string) {
    await searchDepartment(page, departmentName);
    await page.getByRole("row").filter({ hasText: departmentName }).click();
  }

  test("Backend should reject creating sub-department under Administration department", async ({
    page,
  }) => {
    // Navigate to Administration department
    await openDepartment(page, "Administration");
    await page.waitForLoadState("networkidle");

    // Click Add Department/Team button
    await page.getByRole("button", { name: "Add Department/Team" }).click();

    // Fill in department name (Department type is selected by default)
    const departmentName = faker.word.words(2);
    await page
      .getByRole("textbox", { name: "Name" })
      .pressSequentially(departmentName);

    // Click Create Organization button
    await page.getByRole("button", { name: "Create Organization" }).click();

    // Verify that backend rejects the creation with specific error message
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Cannot create organizations under root organization"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Backend should reject creating sub-team under Administration department", async ({
    page,
  }) => {
    // Navigate to Administration department
    await openDepartment(page, "Administration");
    await page.waitForLoadState("networkidle");

    // Click Add Department/Team button
    await page.getByRole("button", { name: "Add Department/Team" }).click();

    // Fill in team name
    const teamName = faker.word.words(2);
    await page
      .getByRole("textbox", { name: "Name" })
      .pressSequentially(teamName);

    // Select Team type
    await page.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Team" }).first().click();

    // Click Create Organization button
    await page.getByRole("button", { name: "Create Organization" }).click();

    // Verify that backend rejects the creation with specific error message
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Cannot create organizations under root organization"),
    ).toBeVisible({ timeout: 10000 });
  });
});
