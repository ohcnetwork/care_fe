import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Location Tags", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("A tagged location keeps tag controls in settings and fills forms from its workspace", async ({
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

    await test.step("Location settings retains tag controls without a questionnaire action", async () => {
      await page.getByRole("cell", { name: locationName, exact: true }).click();
      await expect(
        page.getByRole("heading", { name: locationName, exact: true }),
      ).toBeVisible();
      await expect(page.getByText(tagName, { exact: true })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Manage Tags", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Fill questionnaire", exact: true }),
      ).toHaveCount(0);
    });

    await test.step("Open a form from the location workspace and return to its settings", async () => {
      const settingsUrl = page.url();
      const locationId = new URL(settingsUrl).pathname.split("/").at(-1);
      const locationPath = `/facility/${facilityId}/locations/${locationId}`;
      await page.goto(`${locationPath}/overview`);
      await page
        .locator('[data-cy="location-overview-page"]')
        .getByRole("button", { name: /Submit forms/ })
        .click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await picker.getByPlaceholder("Search Forms").fill("E2E Location");
      await picker
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
      await expect(page).toHaveURL(`${locationPath}/responses`);
      await page.goto(settingsUrl);
      await expect(page.getByText(tagName, { exact: true })).toBeVisible();
    });
  });
});
