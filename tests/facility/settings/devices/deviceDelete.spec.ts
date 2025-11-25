import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Device Delete", () => {
  let facilityId: string;
  let deviceName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    deviceName = faker.commerce.productName();

    await page.goto(`/facility/${facilityId}/settings/devices`);
  });

  test("Create a device, delete it, and verify it no longer exists", async ({
    page,
  }) => {
    // Create a new device
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

    // Verify device is displayed
    await expect(page.getByRole("heading", { name: deviceName })).toBeVisible();

    // Click Delete button in the Danger Zone
    await page.getByRole("button", { name: "Delete" }).click();

    // Confirm deletion in the dialog
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    // Search for the deleted device
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);

    // Verify device is not found in the list
    await expect(
      page.getByRole("link", { name: deviceName }),
    ).not.toBeVisible();

    // Verify "No devices found" message or empty state
    await expect(
      page.getByText("No devices match your search criteria", { exact: false }),
    ).toBeVisible();
  });

  test("Cancel device deletion and verify device still exists", async ({
    page,
  }) => {
    // Create a new device
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

    // Verify device is displayed
    await expect(page.getByRole("heading", { name: deviceName })).toBeVisible();

    // Click Delete button
    await page.getByRole("button", { name: "Delete" }).click();

    // Cancel deletion in the dialog
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify we're still on the device details page
    await expect(page.getByRole("heading", { name: deviceName })).toBeVisible();

    // Navigate back to devices list
    await page.goto(`/facility/${facilityId}/settings/devices`);

    // Search for the device
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);

    // Verify device still exists in the list
    await expect(page.getByRole("link", { name: deviceName })).toBeVisible();
  });
});
