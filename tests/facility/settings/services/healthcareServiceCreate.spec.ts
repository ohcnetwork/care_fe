import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { expectToast, selectFromLocationMultiSelect } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const INTERNAL_TYPES = ["Pharmacy", "Lab", "Scheduling", "Store"];

test.describe("Healthcare Services Management - Create", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/healthcare_services/new`);
    await expect(
      page.getByRole("heading", { name: "Create Healthcare Service" }),
    ).toBeVisible();
  });

  test("creates a healthcare service with name, internal type, details and a location", async ({
    page,
  }) => {
    const serviceName = faker.commerce.productName();
    const extraDetails = faker.lorem.sentence();
    const internalType = faker.helpers.arrayElement(INTERNAL_TYPES);

    await test.step("Fill the healthcare service form", async () => {
      await page.getByRole("textbox", { name: "Name" }).fill(serviceName);

      await page
        .getByRole("combobox", { name: "Internal Type", exact: true })
        .click();
      await page
        .getByRole("option", { name: internalType, exact: true })
        .click();

      await page
        .getByRole("textbox", { name: "Extra Details", exact: true })
        .fill(extraDetails);

      const locationsTrigger = page
        .getByRole("combobox")
        .filter({ hasText: "Select locations" });
      await selectFromLocationMultiSelect(page, locationsTrigger, {
        itemIndex: 0,
      });
    });

    await test.step("Submit and verify the success toast and redirect", async () => {
      await page.getByRole("button", { name: "Create", exact: true }).click();

      await expectToast(page, "Healthcare service created successfully");
      await page.waitForURL(/\/facility\/[^/]+\/settings\/healthcare_services$/);
      await expect(
        page.getByRole("heading", { name: "Healthcare Services" }),
      ).toBeVisible();
    });

    await test.step("Verify the new service is listed and persisted", async () => {
      await page
        .getByRole("textbox", { name: "Search healthcare services..." })
        .fill(serviceName);

      await page.getByRole("link", { name: serviceName }).click();

      await expect(
        page.getByRole("heading", { name: "Healthcare Service Details" }),
      ).toBeVisible();
      await expect(page.getByText(serviceName)).toBeVisible();
      await expect(page.getByText(extraDetails)).toBeVisible();
    });
  });

  test("shows validation errors when name and locations are missing", async ({
    page,
  }) => {
    await test.step("Dirty the form without filling the required fields", async () => {
      // Submit stays disabled until the form is dirty, so edit an optional field.
      await page
        .getByRole("textbox", { name: "Extra Details", exact: true })
        .fill(faker.lorem.sentence());
    });

    await test.step("Submit and verify both required-field errors", async () => {
      await page.getByRole("button", { name: "Create", exact: true }).click();

      const nameField = page.getByRole("textbox", { name: "Name" });
      await expect(getFieldErrorMessage(nameField)).toHaveText(
        "Name is required",
      );
      await expect(
        page.getByText("At least one location is required"),
      ).toBeVisible();

      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/healthcare_services\/new$/,
      );
    });
  });

  test("keeps the create button disabled until the form is edited", async ({
    page,
  }) => {
    const createButton = page.getByRole("button", {
      name: "Create",
      exact: true,
    });

    await expect(createButton).toBeDisabled();

    await page
      .getByRole("textbox", { name: "Name" })
      .fill(faker.commerce.productName());

    await expect(createButton).toBeEnabled();
  });
});
