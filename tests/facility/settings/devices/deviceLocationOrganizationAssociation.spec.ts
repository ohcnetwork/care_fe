import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Device Location and Organization Association", () => {
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
    // Click associate button for location
    const locationSection = page.locator("text=Location").first();
    await locationSection
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

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
    await page.waitForTimeout(1000); // Wait for search results

    // Click on first location result if available
    const locationResults = page.locator('[role="button"]', {
      hasText: /ward/i,
    });
    const count = await locationResults.count();

    if (count > 0) {
      await locationResults.first().click();

      // Click associate button in the sheet
      await page
        .getByRole("button", { name: "Associate" })
        .last()
        .click({ timeout: 5000 });

      // Should show success message
      await expect(
        page.getByText("Location associated successfully"),
      ).toBeVisible({ timeout: 5000 });

      // Location should now be displayed
      await expect(page.getByText("No location associated")).not.toBeVisible({
        timeout: 2000,
      });
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
    await page.waitForTimeout(1000);

    const locationResults = page.locator('[role="button"]', {
      hasText: /ward/i,
    });
    const count = await locationResults.count();

    if (count > 0) {
      await locationResults.first().click();
      await page
        .getByRole("button", { name: "Associate" })
        .last()
        .click({ timeout: 5000 });

      await expect(
        page.getByText("Location associated successfully"),
      ).toBeVisible({ timeout: 5000 });

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
      ).toBeVisible({ timeout: 5000 });
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

  test("should display no organization associated message when device has no organization", async ({
    page,
  }) => {
    // Check for no organization message
    await expect(page.getByText("No organization associated")).toBeVisible();
  });

  test("should open organization association sheet", async ({ page }) => {
    // Click associate button for organization
    const organizationSection = page.locator("text=Managing Organization");
    await organizationSection
      .locator("..")
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .first()
      .click();

    // Sheet should open
    await expect(
      page.getByRole("heading", { name: "Link Departments" }),
    ).toBeVisible();
  });

  test("should associate an organization to device", async ({ page }) => {
    // Click associate button for organization
    const associateButton = page
      .locator('[class*="md:col-span-2"]')
      .filter({ hasText: "Managing Organization" })
      .getByRole("button", { name: "Associate" })
      .first();

    await associateButton.click();

    // Wait for the sheet to open
    await expect(
      page.getByRole("heading", { name: "Link Departments" }),
    ).toBeVisible();

    // Search for an organization/department
    const orgSearch = page.getByPlaceholder("Search departments...");
    await orgSearch.fill("cardiology");
    await page.waitForTimeout(1000); // Wait for search results

    // Click on first organization result if available
    const orgResults = page.locator('[role="button"]', {
      hasText: /cardiology/i,
    });
    const count = await orgResults.count();

    if (count > 0) {
      await orgResults.first().click();

      // Click link button in the sheet
      await page
        .getByRole("button", { name: "Link" })
        .last()
        .click({ timeout: 5000 });

      // Should show success message
      await expect(page.getByText(/linked successfully/i)).toBeVisible({
        timeout: 5000,
      });

      // Organization should now be displayed
      await expect(
        page.getByText("No organization associated"),
      ).not.toBeVisible({ timeout: 2000 });
    }
  });

  test("should allow changing organization associated with device", async ({
    page,
  }) => {
    // First associate an organization
    const associateButton = page
      .locator('[class*="md:col-span-2"]')
      .filter({ hasText: "Managing Organization" })
      .getByRole("button", { name: "Associate" })
      .first();

    await associateButton.click();

    await expect(
      page.getByRole("heading", { name: "Link Departments" }),
    ).toBeVisible();

    const orgSearch = page.getByPlaceholder("Search departments...");
    await orgSearch.fill("cardiology");
    await page.waitForTimeout(1000);

    const orgResults = page.locator('[role="button"]', {
      hasText: /cardiology/i,
    });
    const count = await orgResults.count();

    if (count > 0) {
      await orgResults.first().click();
      await page
        .getByRole("button", { name: "Link" })
        .last()
        .click({ timeout: 5000 });

      await expect(page.getByText(/linked successfully/i)).toBeVisible({
        timeout: 5000,
      });

      // Close the sheet
      await page.keyboard.press("Escape");

      // Open the sheet again to change organization
      await page
        .locator('[class*="md:col-span-2"]')
        .filter({ hasText: "Managing Organization" })
        .getByRole("button", { name: "Change" })
        .first()
        .click();

      // Should show current organization with unlink option
      await expect(page.getByText("Current Linked Departments")).toBeVisible();

      // Search for a different organization
      const newOrgSearch = page.getByPlaceholder("Search departments...");
      await newOrgSearch.fill("surgery");
      await page.waitForTimeout(1000);

      const newOrgResults = page.locator('[role="button"]', {
        hasText: /surgery/i,
      });
      const newCount = await newOrgResults.count();

      if (newCount > 0) {
        await newOrgResults.first().click();
        await page
          .getByRole("button", { name: "Link" })
          .last()
          .click({ timeout: 5000 });

        // Should show success message
        await expect(page.getByText(/linked successfully/i)).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test("should verify location and organization are independent", async ({
    page,
  }) => {
    // Associate both location and organization

    // Associate location first
    const locationButton = page
      .locator('[class*="grid"]')
      .filter({ hasText: "Location" })
      .getByRole("button", { name: "Associate" })
      .first();

    await locationButton.click();
    await expect(
      page.getByRole("heading", { name: "Associate Location" }),
    ).toBeVisible();

    const locationSearch = page.getByPlaceholder("Search location...");
    await locationSearch.fill("ward");
    await locationSearch.press("Enter");
    await page.waitForTimeout(1000);

    const locationResults = page.locator('[role="button"]', {
      hasText: /ward/i,
    });
    const locationCount = await locationResults.count();

    if (locationCount > 0) {
      await locationResults.first().click();
      await page
        .getByRole("button", { name: "Associate" })
        .last()
        .click({ timeout: 5000 });

      await expect(
        page.getByText("Location associated successfully"),
      ).toBeVisible({ timeout: 5000 });

      await page.keyboard.press("Escape");
    }

    // Now associate organization
    const orgButton = page
      .locator('[class*="md:col-span-2"]')
      .filter({ hasText: "Managing Organization" })
      .getByRole("button", { name: "Associate" })
      .first();

    await orgButton.click();
    await expect(
      page.getByRole("heading", { name: "Link Departments" }),
    ).toBeVisible();

    const orgSearch = page.getByPlaceholder("Search departments...");
    await orgSearch.fill("cardiology");
    await page.waitForTimeout(1000);

    const orgResults = page.locator('[role="button"]', {
      hasText: /cardiology/i,
    });
    const orgCount = await orgResults.count();

    if (orgCount > 0) {
      await orgResults.first().click();
      await page
        .getByRole("button", { name: "Link" })
        .last()
        .click({ timeout: 5000 });

      await expect(page.getByText(/linked successfully/i)).toBeVisible({
        timeout: 5000,
      });
    }

    // Both should be visible and independent
    await expect(page.getByText("No location associated")).not.toBeVisible();
    await expect(
      page.getByText("No organization associated"),
    ).not.toBeVisible();
  });
});
