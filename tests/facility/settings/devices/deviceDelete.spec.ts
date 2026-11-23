import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createDeviceViaUi,
  searchAndOpenDevice,
} from "tests/helper/facilitySettings";
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

  test(
    "Create a device, delete it, and verify it no longer exists",
    {
      tag: ["@atomic", "@cap:device.delete"],
    },
    async ({ page }) => {
      // Create a new device
      await createDeviceViaUi(page, { facilityId, name: deviceName });

      // Navigate to the device details page
      await searchAndOpenDevice(page, deviceName);

      // Verify device is displayed
      await expect(
        page.getByRole("heading", { name: deviceName }),
      ).toBeVisible();

      // Click Delete button in the Danger Zone
      await page.getByRole("button", { name: "Delete" }).click();

      // Confirm deletion in the dialog (button name includes its shortcut badge)
      await page
        .getByRole("alertdialog", { name: "Delete Device" })
        .getByRole("button", { name: /^Delete/ })
        .click();

      // Search for the deleted device
      await page
        .getByRole("textbox", { name: "Search devices..." })
        .fill(deviceName);

      // Verify device is not found in the list
      await expect(page.getByRole("link", { name: deviceName })).toBeHidden();

      // Verify "No devices found" message or empty state
      await expect(
        page.getByText("No devices match your search criteria", {
          exact: false,
        }),
      ).toBeVisible();
    },
  );

  test(
    "Cancel device deletion and verify device still exists",
    {
      tag: ["@atomic", "@cap:device.delete"],
    },
    async ({ page }) => {
      // Create a new device
      await createDeviceViaUi(page, { facilityId, name: deviceName });

      // Navigate to the device details page
      await searchAndOpenDevice(page, deviceName);

      // Verify device is displayed
      await expect(
        page.getByRole("heading", { name: deviceName }),
      ).toBeVisible();

      // Click Delete button
      await page.getByRole("button", { name: "Delete" }).click();

      // Cancel deletion in the dialog
      await page.getByRole("button", { name: "Cancel" }).click();

      // Verify we're still on the device details page
      await expect(
        page.getByRole("heading", { name: deviceName }),
      ).toBeVisible();

      // Navigate back to devices list and wait for the device list API to load
      const devicesResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/device/") && resp.request().method() === "GET",
      );
      await page.goto(`/facility/${facilityId}/settings/devices`);
      await devicesResponse;

      // Search for the device
      await page
        .getByRole("textbox", { name: "Search devices..." })
        .fill(deviceName);

      // Verify device still exists in the list
      await expect(page.getByRole("link", { name: deviceName })).toBeVisible();
    },
  );
});
