import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import {
  addDeviceServiceRecordViaUi,
  createDeviceViaUi,
  searchAndOpenDevice,
} from "tests/helper/facilitySettings";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Device Service History", () => {
  let facilityId: string;
  let notes: string;
  let updatedNotes: string;
  let deviceName: string;
  let deviceId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    notes = faker.lorem.sentence();
    updatedNotes = faker.lorem.sentence();
    // Each test records service history on a device of its own, not on a
    // device other specs also read.
    deviceName = `Service-${faker.string.alphanumeric(8)}`;
    await page.goto(`/facility/${facilityId}/settings/devices`);
    ({ deviceId } = await createDeviceViaUi(page, {
      facilityId,
      name: deviceName,
    }));
  });

  test(
    "Open random device and create a new service record",
    {
      tag: ["@atomic", "@cap:device.service-record.create"],
    },
    async ({ page }) => {
      // Open the device created for this test
      await searchAndOpenDevice(page, deviceName);

      await addDeviceServiceRecordViaUi(page, { facilityId, deviceId, notes });

      await expect(page.getByText(notes)).toBeVisible();
    },
  );

  test(
    "Edit an existing service record and verify changes",
    {
      tag: ["@atomic", "@cap:device.service-record.edit"],
    },
    async ({ page }) => {
      // Open the device created for this test
      await searchAndOpenDevice(page, deviceName);

      await addDeviceServiceRecordViaUi(page, { facilityId, deviceId, notes });

      // Wait for the Add sheet to fully close before opening Edit; otherwise its
      // controls linger in the DOM during the close animation and collide with
      // the edit sheet's controls.
      await expect(page.getByRole("button", { name: "Save" })).toBeHidden();

      await page
        .locator('[data-slot="card"]')
        .filter({ hasText: notes })
        .locator("button:has(.lucide-square-pen)")
        .first()
        .click();

      // With the Add sheet closed, the edit sheet is the only open dialog. Use
      // .last() to target the most recently opened dialog so a still-unmounting
      // sheet can't reintroduce a strict-mode match.
      const editSheet = page.getByRole("dialog").last();
      await expect(editSheet).toBeVisible();

      const pastYear = new Date().getFullYear() - 1;
      await editSheet
        .locator('[data-slot="form-item"]')
        .filter({ hasText: "Service Date" })
        .locator('[data-slot="popover-trigger"]')
        .click();
      await page
        .locator(".rdp-years_dropdown")
        .selectOption(pastYear.toString());
      await page
        .locator('[role="gridcell"]:not([data-outside])')
        .first()
        .click();

      await editSheet
        .getByRole("textbox", { name: "Notes *" })
        .fill(updatedNotes);

      await editSheet.getByRole("button", { name: "Update" }).click();

      const updatedCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: updatedNotes })
        .first();

      await updatedCard.scrollIntoViewIfNeeded();
      await expect(updatedCard).toBeVisible();

      await expect(
        page.locator('[data-slot="card"]').filter({ hasText: notes }),
      ).toHaveCount(0);
    },
  );

  test(
    "should reject whitespace-only input in required text fields",
    {
      tag: ["@atomic", "@cap:device.service-record.create"],
    },
    async ({ page }) => {
      await searchAndOpenDevice(page, deviceName);

      await page.getByRole("button", { name: "Add Service Record" }).click();

      const notesField = page.getByRole("textbox", { name: "Notes *" });
      await notesField.fill("   ");

      await page.getByRole("button", { name: "Save" }).click();

      const errorMessage = getFieldErrorMessage(notesField);
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveText("This field is required");
    },
  );

  test(
    "Show validation error for future date in service record",
    {
      tag: ["@atomic", "@cap:device.service-record.create"],
    },
    async ({ page }) => {
      // Open the device created for this test
      await searchAndOpenDevice(page, deviceName);

      // Wait for device details page to load by checking for Add Service Record button
      await expect(
        page.getByRole("button", { name: "Add Service Record" }),
      ).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "Add Service Record" }).click();

      const futureYear = new Date().getFullYear() + 1;
      await page
        .locator('[data-slot="form-item"]')
        .filter({ hasText: "Service Date" })
        .locator('[data-slot="popover-trigger"]')
        .click();
      await page
        .locator(".rdp-years_dropdown")
        .selectOption(futureYear.toString());
      await page
        .locator('[role="gridcell"]:not([data-outside])')
        .first()
        .click();

      await page
        .getByRole("textbox", { name: "Notes *" })
        .fill(faker.lorem.sentence());

      await page.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByText("Service date must be set to today or a past date"),
      ).toBeVisible();
    },
  );

  test(
    "Save button should be disabled when no changes are made in edit mode",
    {
      tag: ["@atomic", "@cap:device.service-record.edit"],
    },
    async ({ page }) => {
      // Open the device created for this test
      await searchAndOpenDevice(page, deviceName);

      await addDeviceServiceRecordViaUi(page, { facilityId, deviceId, notes });

      // Wait for the Add sheet to fully close before opening Edit; otherwise its
      // controls linger in the DOM during the close animation and collide with
      // the edit sheet's controls.
      await expect(page.getByRole("button", { name: "Save" })).toBeHidden();

      await page
        .locator('[data-slot="card"]')
        .filter({ hasText: notes })
        .locator("button:has(.lucide-square-pen)")
        .first()
        .click();

      // With the Add sheet closed, the edit sheet is the only open dialog. Use
      // .last() to target the most recently opened dialog so a still-unmounting
      // sheet can't reintroduce a strict-mode match.
      const editSheet = page.getByRole("dialog").last();
      await expect(editSheet).toBeVisible();

      const updateButton = editSheet.getByRole("button", { name: "Update" });
      await expect(updateButton).toBeDisabled();

      await editSheet
        .getByRole("textbox", { name: "Notes *" })
        .fill(updatedNotes);

      await expect(updateButton).toBeEnabled();

      await editSheet.getByRole("textbox", { name: "Notes *" }).fill(notes);

      await expect(updateButton).toBeDisabled();
    },
  );
});
