import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { searchAndOpenDepartment } from "tests/helper/facilitySettings";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Prevent Creating Sub-Department/Team Under Administration", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/departments`);
  });

  test(
    "Backend should reject creating sub-department under Administration department",
    {
      tag: ["@atomic", "@cap:department.sub-department.create"],
    },
    async ({ page }) => {
      // Navigate to Administration department
      await searchAndOpenDepartment(page, "Administration");
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
    },
  );

  test(
    "Backend should reject creating sub-team under Administration department",
    {
      tag: ["@atomic", "@cap:department.sub-team.create"],
    },
    async ({ page }) => {
      // Navigate to Administration department
      await searchAndOpenDepartment(page, "Administration");
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
    },
  );
});
