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
    // Click associate button for location - using a more robust selector
    const associateButton = page
      .locator('[class*="grid"]')
      .filter({ hasText: "Location" })
      .getByRole("button", { name: "Associate" })
      .first();

    await associateButton.click();

    // Sheet should open
    await expect(page.getByText("Associate Location")).toBeVisible();
    await expect(
      page.getByText("Associate a location to track where this device is"),
    ).toBeVisible();
  });

  test("should associate a location to device", async ({ page }) => {
    // Click associate button for location
    const associateButton = page
      .locator('[class*="grid"]')
      .filter({ hasText: "Location" })
      .getByRole("button", { name: "Associate" })
      .first();

    await associateButton.click();

    // Wait for the sheet to open
    await expect(
      page.getByRole("heading", { name: "Associate Location" }),
    ).toBeVisible();

    // Search for a location
    const locationSearch = page.getByPlaceholder("Search location...");
    await locationSearch.fill("ward");
    await locationSearch.press("Enter");

    // Wait for search results and select first location
    await page.waitForLoadState("networkidle");

    // Click on first location result if available
    const locationResults = page.locator('[role="button"]', {
      hasText: /ward/i,
    });
    const count = await locationResults.count();

    if (count > 0) {
      await locationResults.first().click();

      // Click associate button in the sheet
      await page.getByRole("button", { name: "Associate" }).last().click();

      // Should show success message
      await expect(
        page.getByText("Location associated successfully"),
      ).toBeVisible();

      // Location should now be displayed
      await expect(page.getByText("No location associated")).not.toBeVisible();
    }
  });

  test("should display current location and allow disassociation", async ({
    page,
  }) => {
    // First associate a location
    const associateButton = page
      .locator('[class*="grid"]')
      .filter({ hasText: "Location" })
      .getByRole("button", { name: "Associate" })
      .first();

    await associateButton.click();

    await expect(
      page.getByRole("heading", { name: "Associate Location" }),
    ).toBeVisible();

    const locationSearch = page.getByPlaceholder("Search location...");
    await locationSearch.fill("ward");
    await locationSearch.press("Enter");
    await page.waitForLoadState("networkidle");

    const locationResults = page.locator('[role="button"]', {
      hasText: /ward/i,
    });
    const count = await locationResults.count();

    if (count > 0) {
      await locationResults.first().click();
      await page.getByRole("button", { name: "Associate" }).last().click();

      await expect(
        page.getByText("Location associated successfully"),
      ).toBeVisible();

      // Close the sheet by clicking outside or pressing Escape
      await page.keyboard.press("Escape");

      // Open the sheet again
      await page
        .locator('[class*="grid"]')
        .filter({ hasText: "Location" })
        .getByRole("button", { name: "Change" })
        .first()
        .click();

      // Should show current location
      await expect(page.getByText("Current Location")).toBeVisible();

      // Click disassociate
      await page.getByRole("button", { name: "Disassociate" }).click();

      // Should show success message
      await expect(
        page.getByText("Location disassociated successfully"),
      ).toBeVisible();
    }
  });

  test("should display location history", async ({ page }) => {
    // Click associate button for location
    const associateButton = page
      .locator('[class*="grid"]')
      .filter({ hasText: "Location" })
      .getByRole("button", { name: "Associate" })
      .first();

    await associateButton.click();

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
