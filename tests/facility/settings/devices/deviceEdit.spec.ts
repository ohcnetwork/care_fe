import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function createDevice(page: Page, facilityId: string): Promise<string> {
  const deviceName = "Edit-" + faker.string.alphanumeric(8);
  await page.goto(`/facility/${facilityId}/settings/devices`);
  await page.getByRole("link", { name: "Add Device" }).click();
  await page
    .getByRole("textbox", { name: "Registered Name *" })
    .fill(deviceName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Device registered successfully")).toBeVisible();
  return deviceName;
}

test.describe("Facility Device Edit", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test("Edit first device in list and verify changes", async ({ page }) => {
    const deviceName = await createDevice(page, facilityId);

    await page.goto(`/facility/${facilityId}/settings/devices`);
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Wait for device details page to load by checking for Edit button
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

    // Click Edit button
    await page.getByRole("button", { name: "Edit" }).click();

    // Generate new random data for all editable fields
    const newDeviceName = faker.commerce.productName();
    const newUserFriendlyName = faker.word.words(2);
    const newIdentifier = faker.string.alphanumeric(10);
    const newManufacturer = faker.company.name();
    const newLotNumber = faker.string.alphanumeric(8);
    const newSerialNumber = faker.string.alphanumeric(12);
    const newModelNumber = faker.string.alphanumeric(6);
    const newPartNumber = faker.string.alphanumeric(8);

    const statusOptions = ["Active", "Inactive", "Entered in Error"];
    const availabilityOptions = ["Available", "Destroyed", "Damaged", "Lost"];
    const newStatus = faker.helpers.arrayElement(statusOptions);
    const newAvailabilityStatus =
      faker.helpers.arrayElement(availabilityOptions);

    // Fill Registered Name
    const registeredNameInput = page.getByRole("textbox", {
      name: "Registered Name *",
    });
    await registeredNameInput.fill(newDeviceName);

    // Fill User Friendly Name
    const userFriendlyNameInput = page.getByRole("textbox", {
      name: "User Friendly Name",
    });
    await userFriendlyNameInput.fill(newUserFriendlyName);

    // Select new status
    await page.getByRole("combobox", { name: "Status *", exact: true }).click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: newStatus })
      .first()
      .click();

    // Select new availability status
    await page
      .getByRole("combobox", { name: "Availability Status *", exact: true })
      .click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: newAvailabilityStatus })
      .first()
      .click();

    // Fill Identifier
    const identifierInput = page.getByRole("textbox", { name: "Identifier" });
    await identifierInput.fill(newIdentifier);

    // Fill Manufacturer
    const manufacturerInput = page.getByRole("textbox", {
      name: "Manufacturer",
    });
    await manufacturerInput.fill(newManufacturer);

    // Fill Lot Number
    const lotNumberInput = page.getByRole("textbox", { name: "Lot Number" });
    await lotNumberInput.fill(newLotNumber);

    // Fill Serial Number
    const serialNumberInput = page.getByRole("textbox", {
      name: "Serial Number",
    });
    await serialNumberInput.fill(newSerialNumber);

    // Fill Model Number
    const modelNumberInput = page.getByRole("textbox", {
      name: "Model Number",
    });
    await modelNumberInput.fill(newModelNumber);

    // Fill Part Number
    const partNumberInput = page.getByRole("textbox", { name: "Part Number" });
    await partNumberInput.fill(newPartNumber);

    // Register response waiter BEFORE clicking Save to avoid race
    const deviceDetailResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/device/") &&
        !resp.url().includes("service_history") &&
        !resp.url().includes("encounter_history") &&
        !resp.url().includes("location_history") &&
        resp.request().method() === "GET" &&
        resp.status() === 200,
    );

    // Save the changes
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for success message
    await expect(page.getByText("Device updated successfully")).toBeVisible();

    // Wait for page to re-render with updated data
    await deviceDetailResponse;

    // Verify all updated information is displayed on the details page
    await expect(
      page.getByRole("heading", { name: newDeviceName }),
    ).toBeVisible();
    await expect(page.getByText(newUserFriendlyName)).toBeVisible();
    await expect(page.getByText(newIdentifier)).toBeVisible();
    await expect(page.getByText(newManufacturer)).toBeVisible();
    await expect(page.getByText(newLotNumber)).toBeVisible();
    await expect(page.getByText(newSerialNumber)).toBeVisible();
    await expect(page.getByText(newModelNumber)).toBeVisible();
    await expect(page.getByText(newPartNumber)).toBeVisible();
    await expect(page.getByText(newStatus)).toBeVisible();
    await expect(
      page.getByText(newAvailabilityStatus, { exact: true }),
    ).toBeVisible();

    // Navigate back to devices list to verify the device appears with updated name
    await page.goto(`/facility/${facilityId}/settings/devices`);
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(newDeviceName);
    await expect(page.getByRole("link", { name: newDeviceName })).toBeVisible();
  });

  test("Edit device with partial fields and verify", async ({ page }) => {
    const deviceName = await createDevice(page, facilityId);

    await page.goto(`/facility/${facilityId}/settings/devices`);
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Wait for device details page to load by checking for Edit button
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

    // Click Edit button
    await page.getByRole("button", { name: "Edit" }).click();

    // Update only a few fields
    const newUserFriendlyName = faker.word.words(2);
    const newManufacturer = faker.company.name();

    const userFriendlyNameInput = page.getByRole("textbox", {
      name: "User Friendly Name",
    });
    await userFriendlyNameInput.fill(newUserFriendlyName);

    const manufacturerInput = page.getByRole("textbox", {
      name: "Manufacturer",
    });
    await manufacturerInput.fill(newManufacturer);

    // Save the changes
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for success message
    await expect(page.getByText("Device updated successfully")).toBeVisible();

    // Verify updated fields are displayed
    await expect(page.getByText(newUserFriendlyName)).toBeVisible();
    await expect(page.getByText(newManufacturer)).toBeVisible();
  });

  test("Cancel editing and verify no changes are saved", async ({ page }) => {
    const deviceName = await createDevice(page, facilityId);

    await page.goto(`/facility/${facilityId}/settings/devices`);
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Wait for device details page to load by checking for Edit button
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

    // Get original registered name value
    const originalDeviceName = await page
      .locator('h4:has-text("Registered Name") + p')
      .textContent();

    // Click Edit button
    await page.getByRole("button", { name: "Edit" }).click();

    // Make some changes
    const newDeviceName = faker.commerce.productName();
    const registeredNameInput = page.getByRole("textbox", {
      name: "Registered Name *",
    });
    await registeredNameInput.fill(newDeviceName);

    // Click Cancel button instead of Save
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify we're back on the details page with original data
    await expect(
      page.getByRole("heading", { name: originalDeviceName || "" }),
    ).toBeVisible();

    // Verify the new name is NOT present
    if (originalDeviceName !== newDeviceName) {
      await expect(
        page.getByRole("heading", { name: newDeviceName }),
      ).not.toBeVisible();
    }
  });
});
