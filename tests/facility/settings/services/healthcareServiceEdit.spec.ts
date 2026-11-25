import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Service Edit", () => {
  const locationName = "Pharmacy";
  let serviceName: string;
  let originalDetails: string;
  let detailsUrl: string;

  test.beforeEach(async ({ page }) => {
    const servicesUrl = `/facility/${getFacilityId()}/settings/healthcare_services`;
    serviceName = `Service ${faker.string.alphanumeric(8)}`;
    originalDetails = faker.lorem.sentence();

    await test.step("Create a service and open its edit form", async () => {
      await page.goto(`${servicesUrl}/new`);
      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(serviceName);
      await page
        .getByRole("textbox", { name: "Extra Details", exact: true })
        .fill(originalDetails);
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select locations" })
        .click();
      const selectLocation = page.getByRole("button", {
        name: `Select ${locationName}`,
        exact: true,
      });
      await selectLocation.click();
      await page.keyboard.press("Escape");
      await expect(page.getByPlaceholder("Search locations...")).toBeHidden();

      await page.getByRole("button", { name: "Create", exact: true }).click();
      await page
        .getByPlaceholder("Search healthcare services...")
        .fill(serviceName);
      await page
        .getByRole("link")
        .filter({
          has: page.getByRole("heading", { name: serviceName, exact: true }),
        })
        .click();
      const edit = page.getByRole("button", { name: "Edit", exact: true });
      await expect(edit).toBeVisible();
      detailsUrl = new URL(page.url()).pathname;
      await edit.click();
    });
  });

  test("prefills the form and saves a single-field change", async ({
    page,
  }) => {
    const details = page.getByRole("textbox", {
      name: "Extra Details",
      exact: true,
    });
    const save = page.getByRole("button", { name: "Save", exact: true });
    const updatedDetails = `Updated: ${faker.lorem.sentence()}`;

    await test.step("Verify the existing values before editing", async () => {
      await expect(
        page.getByRole("textbox", { name: "Name", exact: true }),
      ).toHaveValue(serviceName);
      await expect(details).toHaveValue(originalDetails);
      await expect(
        page.getByRole("paragraph").filter({ hasText: locationName }),
      ).toHaveText(locationName);
      await expect(save).toBeDisabled();
    });

    await test.step("Save the new details and verify the service", async () => {
      await details.fill(updatedDetails);
      await save.click();
      await expectToast(page, "Healthcare service updated successfully");
      await expect(page).toHaveURL(detailsUrl);
      await expect(
        page.getByText(updatedDetails, { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(serviceName, { exact: true })).toBeVisible();
      await expect(
        page.getByRole("link", { name: locationName, exact: true }),
      ).toBeVisible();
    });
  });

  test("cancels a valid edit and discards the draft", async ({ page }) => {
    const details = page.getByRole("textbox", {
      name: "Extra Details",
      exact: true,
    });

    await test.step("Change the details and cancel without saving", async () => {
      await details.fill(`Draft: ${faker.lorem.sentence()}`);
      await expect(
        page.getByRole("button", { name: "Save", exact: true }),
      ).toBeEnabled();
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(page).toHaveURL(detailsUrl);
    });

    await test.step("Reload and verify the original details are still saved", async () => {
      await page.reload();
      await expect(
        page.getByRole("heading", {
          name: "Healthcare Service Details",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(originalDetails, { exact: true }),
      ).toBeVisible();
    });
  });
});
