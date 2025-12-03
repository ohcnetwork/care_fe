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
    // Click associate button for organization - find by Managing Organization heading
    await page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    // Sheet should open
    await expect(
      page.getByRole("heading", { name: "Manage Organization" }),
    ).toBeVisible();
  });

  test("should associate an organization to device", async ({ page }) => {
    // Click associate button for organization - find by Managing Organization heading
    await page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    // Wait for the sheet to open
    await expect(
      page.getByRole("heading", { name: "Manage Organization" }),
    ).toBeVisible();

    // Administration is pre-selected by default, click Add Organization
    await page.getByRole("button", { name: "Add Organization" }).click();

    // Should show success message
    await expect(
      page.getByText(/Organization added successfully/i),
    ).toBeVisible();

    // Organization should now be displayed
    await expect(
      page.getByText("No organization associated"),
    ).not.toBeVisible();
  });

  test("should allow changing organization associated with device", async ({
    page,
  }) => {
    // First associate an organization - find by Managing Organization heading
    await page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Manage Organization" }),
    ).toBeVisible();

    // Administration is pre-selected by default, click Add Organization
    await page.getByRole("button", { name: "Add Organization" }).click();

    await expect(
      page.getByText(/Organization added successfully/i),
    ).toBeVisible();

    // Close the sheet
    await page.keyboard.press("Escape");

    // Open the sheet again to change organization
    await page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..")
      .getByRole("button", { name: "Change" })
      .click();

    // Should show current organization
    await expect(page.getByText("Current Organization")).toBeVisible();
    await expect(page.getByText("Administration").first()).toBeVisible();

    // Click "All Organizations" tab to see more options
    await page.getByRole("tab", { name: "All Organizations" }).click();

    // Click the Select Department dropdown (using popover-trigger)
    await page
      .locator('[data-slot="popover-trigger"]')
      .filter({ hasText: "Select Department" })
      .click();

    // Wait for the department list to load and select any item
    const departmentItem = page.locator('[data-slot="command-item"]').first();
    await expect(departmentItem).toBeVisible();
    await departmentItem.click();

    // Click Add Organization
    await page.getByRole("button", { name: "Add Organization" }).click();

    // Should show success message
    await expect(
      page.getByText(/Organization added successfully/i),
    ).toBeVisible();

    // Verify the Managing Organization section shows the new organization, not Administration
    const managingOrgSection = page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..");
    await expect(
      managingOrgSection.getByText("Administration"),
    ).not.toBeVisible();
    await expect(
      managingOrgSection.getByRole("button", { name: "Change" }),
    ).toBeVisible();
  });
});
