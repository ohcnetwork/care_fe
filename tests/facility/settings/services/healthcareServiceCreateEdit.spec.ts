import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

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
      await page.getByRole("textbox", { name: /name/i }).fill(serviceName);
    });

    await test.step("Select a location", async () => {
      // Click the location selector
      const locationTrigger = page
        .getByRole("combobox")
        .filter({ hasText: /select locations/i })
        .or(page.getByText(/select locations/i));
      await locationTrigger.first().click();

      // Wait for the location picker to open and select the first location
      const plusButton = page.locator("button:has(svg.lucide-plus)").first();
      await expect(plusButton).toBeVisible({ timeout: 5000 });
      await plusButton.click();

      // Close the picker
      await page.keyboard.press("Escape");
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

      await page.getByRole("textbox", { name: /name/i }).fill(originalName);

      // Select a location
      const locationTrigger = page
        .getByRole("combobox")
        .filter({ hasText: /select locations/i })
        .or(page.getByText(/select locations/i));
      await locationTrigger.first().click();

      const plusButton = page.locator("button:has(svg.lucide-plus)").first();
      await expect(plusButton).toBeVisible({ timeout: 5000 });
      await plusButton.click();
      await page.keyboard.press("Escape");

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
      await page.getByRole("textbox", { name: /name/i }).clear();
      await page.getByRole("textbox", { name: /name/i }).fill(updatedName);

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

  test("should keep the create button disabled until the form is valid", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /add healthcare service/i }).click();
    await page.waitForURL(/\/healthcare_services\/new/);

    // Name (and a location) are required, so the create action stays disabled
    // on an empty form.
    await expect(page.getByRole("button", { name: /create/i })).toBeDisabled();
  });
});
