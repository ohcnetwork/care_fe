import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Device Service History", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/devices`);
  });

  test("Open random device and create a new service record", async ({
    page,
  }) => {
    // Wait for the device list to load
    await page.waitForLoadState("networkidle");

    // Get the first device link from the list
    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible();

    // Click on the first device to view details
    await firstDeviceLink.click();
    await page.waitForLoadState("networkidle");

    // Click Add Service Record button
    await page.getByRole("button", { name: "Add Service Record" }).click();

    // Generate service record data
    const notes = faker.lorem.sentence();

    // Fill service record form (date is auto-filled to today)

    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);

    // Save the service record
    await page.getByRole("button", { name: "Save" }).click();

    // Verify the service record appears in the service history
    await expect(page.getByText(notes)).toBeVisible();
  });

  test("Edit an existing service record and verify changes", async ({
    page,
  }) => {
    // Wait for the device list to load
    await page.waitForLoadState("networkidle");

    // Get the first device link from the list
    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible();

    // Click on the first device to view details
    await firstDeviceLink.click();
    await page.waitForLoadState("networkidle");

    // Create a service record first
    await page.getByRole("button", { name: "Add Service Record" }).click();

    const originalNotes = faker.lorem.sentence();

    // Use auto-filled current date
    await page.getByRole("textbox", { name: "Notes *" }).fill(originalNotes);
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for service record to appear
    await expect(page.getByText(originalNotes)).toBeVisible();

    // Click edit button on the service record

    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: originalNotes })
      .locator("button:has(.lucide-square-pen)")
      .first()
      .click();

    // Update the service record with new data
    const updatedNotes = faker.lorem.sentence();

    // Change to previous year for past date
    const pastYear = new Date().getFullYear() - 1;
    await page
      .locator('[data-slot="form-item"]')
      .filter({ hasText: "Service Date" })
      .locator('[data-slot="popover-trigger"]')
      .click();
    await page.locator(".rdp-years_dropdown").selectOption(pastYear.toString());
    await page.locator('[role="gridcell"]:not([data-outside])').first().click();

    await page.getByRole("textbox", { name: "Notes *" }).fill(updatedNotes);

    // Save the updated service record
    await page.getByRole("button", { name: "Update" }).click();

    // Verify the updated information is displayed
    await expect(page.getByText(updatedNotes)).toBeVisible();

    // Verify old notes are not visible
    await expect(page.getByText(originalNotes)).not.toBeVisible();
  });

  test("Show validation error for future date in service record", async ({
    page,
  }) => {
    // Wait for the device list to load
    await page.waitForLoadState("networkidle");

    // Get the first device link from the list
    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible();

    // Click on the first device to view details
    await firstDeviceLink.click();
    await page.waitForLoadState("networkidle");

    // Click Add Service Record button
    await page.getByRole("button", { name: "Add Service Record" }).click();

    // Click date picker and change to next year for future date
    const futureYear = new Date().getFullYear() + 1;
    await page
      .locator('[data-slot="form-item"]')
      .filter({ hasText: "Service Date" })
      .locator('[data-slot="popover-trigger"]')
      .click();
    await page
      .locator(".rdp-years_dropdown")
      .selectOption(futureYear.toString());
    await page.locator('[role="gridcell"]:not([data-outside])').first().click();

    await page
      .getByRole("textbox", { name: "Notes *" })
      .fill(faker.lorem.sentence());

    // Try to save
    await page.getByRole("button", { name: "Save" }).click();

    // Verify validation error for future date (as shown in the screenshot)
    await expect(
      page.getByText("Service date must be set to today or a past date"),
    ).toBeVisible();
  });

  test("Save button should be disabled when no changes are made in edit mode", async ({
    page,
  }) => {
    // Wait for the device list to load
    await page.waitForLoadState("networkidle");

    // Get the first device link from the list
    const firstDeviceLink = page
      .getByRole("link")
      .filter({ has: page.locator('[data-slot="card"]') })
      .first();

    await expect(firstDeviceLink).toBeVisible();

    // Click on the first device to view details
    await firstDeviceLink.click();
    await page.waitForLoadState("networkidle");

    // Create a service record first
    await page.getByRole("button", { name: "Add Service Record" }).click();

    const notes = faker.lorem.sentence();

    // Use auto-filled current date
    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for service record to appear
    await expect(page.getByText(notes)).toBeVisible();

    // Click edit button on the service record
    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: notes })
      .locator("button:has(.lucide-square-pen)")
      .first()
      .click();

    // Verify Save button is disabled when no changes are made
    const saveButton = page.getByRole("button", { name: "Update" });
    await expect(saveButton).toBeDisabled();

    // Make a change to notes
    const newNotes = faker.lorem.sentence();
    await page.getByRole("textbox", { name: "Notes *" }).fill(newNotes);

    // Verify Save button is now enabled
    await expect(saveButton).toBeEnabled();

    // Revert the change
    await page.getByRole("textbox", { name: "Notes *" }).fill(notes);

    // Verify Save button is disabled again
    await expect(saveButton).toBeDisabled();
  });
});
