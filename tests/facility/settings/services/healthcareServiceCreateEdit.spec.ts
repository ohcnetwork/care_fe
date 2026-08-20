import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { selectFromLocationMultiSelect } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// Selecting the first available location is repeated across the create and edit
// flows, so keep it in one place.
async function selectFirstLocation(page: Page) {
  const locationTrigger = page
    .getByRole("combobox")
    .filter({ hasText: /select locations/i })
    .or(page.getByText(/select locations/i))
    .first();
  await selectFromLocationMultiSelect(page, locationTrigger);
}

test.describe("Healthcare Service Create & Edit", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/healthcare_services`);
  });

  test("should create a new healthcare service", async ({ page }) => {
    const serviceName = faker.commerce.productName();

    await test.step("Open creation form", async () => {
      await page
        .getByRole("button", { name: /add healthcare service/i })
        .click();
      await page.waitForURL(/\/healthcare_services\/new/);
    });

    await test.step("Fill service name", async () => {
      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(serviceName);
    });

    await test.step("Select a location", async () => {
      await selectFirstLocation(page);
    });

    await test.step("Submit the form", async () => {
      await page.getByRole("button", { name: /create/i }).click();

      await expect(
        page.getByText(/healthcare service created successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify service appears in list", async () => {
      // Should redirect back to the list
      await page.waitForURL(/\/healthcare_services$/);

      // Search for the created service
      await page
        .getByRole("textbox", { name: /search healthcare services/i })
        .fill(serviceName);

      // Verify the service link is visible
      await expect(page.getByRole("link", { name: serviceName })).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test("should edit an existing healthcare service", async ({ page }) => {
    const originalName = faker.commerce.productName();
    const updatedName = faker.commerce.productName();

    // First create a service
    await test.step("Create a healthcare service", async () => {
      await page
        .getByRole("button", { name: /add healthcare service/i })
        .click();
      await page.waitForURL(/\/healthcare_services\/new/);

      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(originalName);

      // Select a location
      await selectFirstLocation(page);

      await page.getByRole("button", { name: /create/i }).click();
      await expect(
        page.getByText(/healthcare service created successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });

    // Navigate to the created service
    await test.step("Navigate to the service", async () => {
      await page
        .getByRole("textbox", { name: /search healthcare services/i })
        .fill(originalName);
      await page.getByRole("link", { name: originalName }).click();
    });

    // Click edit
    await test.step("Edit the service", async () => {
      await page.getByRole("button", { name: "Edit" }).click();
      await page.waitForURL(/\/edit$/);

      // Clear and update the name
      await page.getByRole("textbox", { name: "Name", exact: true }).clear();
      await page
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(updatedName);

      await page.getByRole("button", { name: "Save" }).click();
      await expect(
        page.getByText(/healthcare service updated successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });

    // Verify the updated name
    await test.step("Verify updated name", async () => {
      await expect(page.getByText(updatedName).first()).toBeVisible();
    });
  });

  test("should enable the create button only once the form is valid", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /add healthcare service/i }).click();
    await page.waitForURL(/\/healthcare_services\/new/);

    // Name (and a location) are required, so the create action stays disabled
    // on an empty form.
    const createButton = page.getByRole("button", { name: /create/i });
    await expect(createButton).toBeDisabled();

    // Filling the required name and selecting a location makes the form valid,
    // which must enable the create action. The form is intentionally never
    // submitted — this asserts validation only, so nothing is persisted.
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(faker.commerce.productName());
    await selectFirstLocation(page);

    await expect(createButton).toBeEnabled();
  });
});
