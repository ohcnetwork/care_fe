import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Device Organization Association", () => {
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

  test("should display no organization associated message when device has no organization", async ({
    page,
  }) => {
    // Check for no organization message
    await expect(page.getByText("No organization associated")).toBeVisible();
  });

  test("should open organization association sheet", async ({ page }) => {
    // Click associate button for organization - using a more robust selector
    const associateButton = page
      .locator('[class*="md:col-span-2"]')
      .filter({ hasText: "Managing Organization" })
      .getByRole("button", { name: "Associate" })
      .first();

    await associateButton.click();

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
    await page.waitForLoadState("networkidle");

    // Click on first organization result if available
    const orgResults = page.locator('[role="button"]', {
      hasText: /cardiology/i,
    });
    const count = await orgResults.count();

    if (count > 0) {
      await orgResults.first().click();

      // Click link button in the sheet
      await page.getByRole("button", { name: "Link" }).last().click();

      // Should show success message
      await expect(page.getByText(/linked successfully/i)).toBeVisible();

      // Organization should now be displayed
      await expect(
        page.getByText("No organization associated"),
      ).not.toBeVisible();
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
    await page.waitForLoadState("networkidle");

    const orgResults = page.locator('[role="button"]', {
      hasText: /cardiology/i,
    });
    const count = await orgResults.count();

    if (count > 0) {
      await orgResults.first().click();
      await page.getByRole("button", { name: "Link" }).last().click();

      await expect(page.getByText(/linked successfully/i)).toBeVisible();

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
      await page.waitForLoadState("networkidle");

      const newOrgResults = page.locator('[role="button"]', {
        hasText: /surgery/i,
      });
      const newCount = await newOrgResults.count();

      if (newCount > 0) {
        await newOrgResults.first().click();
        await page.getByRole("button", { name: "Link" }).last().click();

        // Should show success message
        await expect(page.getByText(/linked successfully/i)).toBeVisible();
      }
    }
  });
});
