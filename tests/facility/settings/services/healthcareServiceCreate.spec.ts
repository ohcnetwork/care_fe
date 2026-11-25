import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { expectToast, selectComboboxOption } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Service Create", () => {
  let servicesUrl: string;

  test.beforeEach(async ({ page }) => {
    servicesUrl = `/facility/${getFacilityId()}/settings/healthcare_services`;
    await page.goto(`${servicesUrl}/new`);
  });

  test("requires a nonblank name and at least one location", async ({
    page,
  }) => {
    const nameInput = page.getByRole("textbox", { name: "Name", exact: true });
    const create = page.getByRole("button", { name: "Create", exact: true });
    const nameError = getFieldErrorMessage(nameInput);
    const locationError = page.getByText("At least one location is required", {
      exact: true,
    });

    await test.step("Submitting whitespace with no location shows both errors", async () => {
      await expect(create).toBeDisabled();
      await nameInput.fill("   ");
      await create.click();

      await expect(nameError).toHaveText("Name is required");
      await expect(locationError).toBeVisible();
    });

    await test.step("A name alone does not satisfy validation", async () => {
      await nameInput.fill(`Service ${faker.string.alphanumeric(8)}`);
      await create.click();

      await expect(nameError).toBeHidden();
      await expect(locationError).toBeVisible();
      await expect(page).toHaveURL(`${servicesUrl}/new`);
    });
  });

  test("creates a service and shows its saved details", async ({ page }) => {
    const serviceName = `Service ${faker.string.alphanumeric(8)}`;
    const details = faker.lorem.sentence();
    const locationName = "Pharmacy";
    const icon = "microscope";
    const create = page.getByRole("button", { name: "Create", exact: true });
    const internalType = page.getByRole("combobox", {
      name: "Internal Type",
      exact: true,
    });

    await test.step("Selecting an icon enables Create", async () => {
      await expect(create).toBeDisabled();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select an icon" })
        .click();
      await page.getByRole("option", { name: icon, exact: true }).click();
      await expect(create).toBeEnabled();
    });

    await test.step("Complete the form and create the service", async () => {
      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(serviceName);
      await page
        .getByRole("textbox", { name: "Extra Details", exact: true })
        .fill(details);
      await selectComboboxOption(internalType, { name: "Lab", exact: true });
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

      await create.click();
      await expectToast(page, "Healthcare service created successfully");
      await expect(page).toHaveURL(servicesUrl);
    });

    await test.step("Find the new service and verify its details", async () => {
      await page
        .getByPlaceholder("Search healthcare services...")
        .fill(serviceName);
      await page
        .getByRole("link")
        .filter({
          has: page.getByRole("heading", { name: serviceName, exact: true }),
        })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Healthcare Service Details",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByText(serviceName, { exact: true })).toBeVisible();
      await expect(page.getByText(details, { exact: true })).toBeVisible();
      await expect(
        page.getByRole("link", { name: locationName, exact: true }),
      ).toBeVisible();
    });

    await test.step("Verify the internal type and icon were saved", async () => {
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      await expect(internalType).toHaveText("Lab");
      await expect(
        page.getByRole("combobox").filter({ hasText: icon }),
      ).toBeVisible();
    });
  });
});
