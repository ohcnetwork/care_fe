import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Location Tags", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("A tagged location retains its questionnaire entry point and fullscreen fill route", async ({
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
      await page.keyboard.press("Escape");
    });

    await test.step("Verify tag is shown on the location", async () => {
      await expect(
        page.getByRole("cell", { name: tagName }).first(),
      ).toBeVisible();
    });

    await test.step("Open a questionnaire alongside the location's tag controls", async () => {
      await page.getByRole("cell", { name: locationName, exact: true }).click();
      await expect(
        page.getByRole("heading", { name: locationName, exact: true }),
      ).toBeVisible();
      await expect(page.getByText(tagName, { exact: true })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Manage Tags", exact: true }),
      ).toBeVisible();

      await page
        .getByRole("button", { name: "Fill questionnaire", exact: true })
        .click();
      await expect(page).toHaveURL(/\/locations\/[^/]+\/questionnaire$/);
      const locationId = new URL(page.url()).pathname.split("/").at(-2);
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      await page
        .getByRole("combobox", { name: "Select a questionnaire to fill" })
        .click();
      await page.getByPlaceholder("Search forms").fill("E2E Location");
      await page
        .getByRole("option", {
          name: "E2E Location Questionnaire",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("region", { name: "Form canvas" }),
      ).toBeVisible();
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      await expect(
        page.getByRole("tab", { name: "Patient Clinical History" }),
      ).toHaveCount(0);
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page).toHaveURL(
        `/facility/${facilityId}/settings/locations/${locationId}`,
      );
      await expect(page.getByText(tagName, { exact: true })).toBeVisible();
    });
  });
});
