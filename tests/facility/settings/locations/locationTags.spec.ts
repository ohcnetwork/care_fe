import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Location Tags", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("Create a location tag and assign it to a location", async ({
    page,
  }) => {
    const tagName = `Loc Tag ${Date.now()}`;
    const locationName = faker.company.name();

    await test.step("Create a location tag config", async () => {
      await page.goto(`/facility/${facilityId}/settings/tag_config`);
      await page.getByRole("button", { name: "Add tag config" }).click();
      await page.getByRole("textbox", { name: "Display name *" }).fill(tagName);
      await page.getByRole("combobox", { name: "Category" }).click();
      await page.getByRole("option", { name: "Admin" }).click();
      await page.getByRole("combobox", { name: "Resource" }).click();
      await page.getByRole("option", { name: "Location" }).click();
      await page.getByRole("button", { name: "Create tag config" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Tag Config created successfully"),
      ).toBeVisible();
    });

    await test.step("Create a location", async () => {
      await page.goto(`/facility/${facilityId}/settings/locations`);
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("textbox", { name: "Name" }).fill(locationName);
      await page.getByRole("button", { name: "Create" }).click();
      await expect(
        page.locator("li[data-sonner-toast]").getByText("Location Created"),
      ).toBeVisible();
    });

    await test.step("Assign tag to the location", async () => {
      await page
        .getByRole("textbox", { name: "Search by name" })
        .fill(locationName);
      await page.getByRole("button", { name: "Add tags" }).first().click();
      await page.getByText(tagName, { exact: true }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Tags updated successfully"),
      ).toBeVisible();
    });

    await test.step("Verify tag is shown on the location", async () => {
      await expect(
        page.getByRole("cell", { name: tagName }).first(),
      ).toBeVisible();
    });
  });
});
