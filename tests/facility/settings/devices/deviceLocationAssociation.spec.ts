import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Device Location Association", () => {
  let facilityId: string;
  let deviceName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    deviceName = faker.commerce.productName();

    // Create a device first
    await page.goto(`/facility/${facilityId}/settings/devices`);
    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Navigate to the device details page
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();
  });

  test("should display no location associated message when device has no location", async ({
    page,
  }) => {
    // Check for no location message
    await expect(page.getByText("No location associated")).toBeVisible();
  });

  test("should open location association sheet", async ({ page }) => {
    // Click associate button for location - find by Location heading
    await page
      .getByRole("heading", { name: "Location" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    // Sheet should open
    await expect(page.getByText("Associate Location")).toBeVisible();
    await expect(page.getByText("No locations found")).toBeVisible();
  });

  test("should associate a location to device", async ({ page }) => {
    // Click associate button for location - find by Location heading
    await page
      .getByRole("heading", { name: "Location" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    // Wait for the sheet to open
    await expect(
      page.getByRole("heading", { name: "Associate Location" }),
    ).toBeVisible();

    // Click to open location selector
    await page
      .locator('[data-slot="popover-trigger"]')
      .filter({ hasText: "Select location" })
      .click();

    // Search for a location
    await page.getByPlaceholder("Search locations...").fill("bed 5");

    // Click on first location result
    const locationItem = page.locator('[data-slot="command-item"]').first();
    await expect(locationItem).toBeVisible({ timeout: 5000 });
    await locationItem.click();

    // Click associate button in the sheet
    await page.getByRole("button", { name: "Associate" }).last().click();

    // Should show success message
    await expect(
      page.getByText("Location associated successfully"),
    ).toBeVisible();

    // Location should now be displayed
    await expect(page.getByText("No location associated")).not.toBeVisible();
  });

  test("should display current location and allow disassociation", async ({
    page,
  }) => {
    // First associate a location - find by Location heading
    await page
      .getByRole("heading", { name: "Location" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Associate Location" }),
    ).toBeVisible();

    // Click to open location selector
    await page
      .locator('[data-slot="popover-trigger"]')
      .filter({ hasText: "Select location" })
      .click();

    // Search for a location
    await page.getByPlaceholder("Search locations...").fill("bed 5");

    // Click on first location result
    const locationItem = page.locator('[data-slot="command-item"]').first();
    await expect(locationItem).toBeVisible({ timeout: 5000 });
    await locationItem.click();

    await page.getByRole("button", { name: "Associate" }).last().click();

    await expect(
      page.getByText("Location associated successfully"),
    ).toBeVisible();

    // Close the sheet by clicking outside or pressing Escape
    await page.keyboard.press("Escape");

    // Open the sheet again
    await page
      .getByRole("heading", { name: "Location" })
      .locator("..")
      .getByRole("button", { name: "Change" })
      .click();

    // Should show current location
    await expect(page.getByText("Current Location")).toBeVisible();

    // Click disassociate
    await page.getByRole("button", { name: "Disassociate" }).click();

    // Should show success message
    await expect(
      page.getByText("Location disassociated successfully"),
    ).toBeVisible();

    // Verify location appears in location history
    await expect(page.getByText("Location History")).toBeVisible();
    await expect(page.getByText(/bed 5/i)).toBeVisible();
  });

  test("should display location history", async ({ page }) => {
    // Click associate button for location - find by Location heading
    await page
      .getByRole("heading", { name: "Location" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    // Wait for the sheet to open
    await expect(
      page.getByRole("heading", { name: "Associate Location" }),
    ).toBeVisible();

    // Check for location history section
    await expect(page.getByText("Location History")).toBeVisible();

    // Initially should show no locations message
    await expect(page.getByText("No locations found")).toBeVisible();
  });
});
