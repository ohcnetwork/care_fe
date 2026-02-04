import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Devices Management", () => {
  let facilityId: string;
  let deviceName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    deviceName = faker.commerce.productName();

    await page.goto(`/facility/${facilityId}/settings/devices`);
  });

  test("Add a new device and verify its presence", async ({ page }) => {
    // Navigate to Add Device form
    await page.getByRole("link", { name: "Add Device" }).click();

    // Fill only the required field (Registered Name)
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);

    // Save the device
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Search for the newly created device
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Verify device details on the device page with default values
    await expect(page.getByRole("heading", { name: deviceName })).toBeVisible();

    // Verify status and availability badges
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Active" }),
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Available" }),
    ).toBeVisible();
  });

  test("Add a new device with all fields and verify", async ({ page }) => {
    const userFriendlyName = faker.word.words(2);
    const identifier = faker.string.alphanumeric(10);
    const manufacturer = faker.company.name();
    const lotNumber = faker.string.alphanumeric(8);
    const serialNumber = faker.string.alphanumeric(12);
    const modelNumber = faker.string.alphanumeric(6);
    const partNumber = faker.string.alphanumeric(8);
    const phoneNumber =
      faker.helpers.arrayElement(["6", "7", "8", "9"]) +
      faker.string.numeric(9); // Indian mobile format: XXXXXXXXXX (starts with 6-9)

    const statusOptions = ["Active", "Inactive", "Entered in Error"];
    const availabilityOptions = ["Available", "Destroyed", "Damaged", "Lost"];
    const status = faker.helpers.arrayElement(statusOptions);
    const availabilityStatus = faker.helpers.arrayElement(availabilityOptions);

    await page.getByRole("link", { name: "Add Device" }).click();

    // Fill basic information
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
    await page
      .getByRole("textbox", { name: "User Friendly Name" })
      .fill(userFriendlyName);

    // Select status
    await page.getByRole("combobox", { name: "Status *", exact: true }).click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: status })
      .first()
      .click();

    // Select availability status
    await page
      .getByRole("combobox", { name: "Availability Status *", exact: true })
      .click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: availabilityStatus })
      .first()
      .click();

    // Fill device details
    await page.getByRole("textbox", { name: "Identifier" }).fill(identifier);
    await page
      .getByRole("textbox", { name: "Manufacturer" })
      .fill(manufacturer);
    await page.getByRole("textbox", { name: "Lot Number" }).fill(lotNumber);
    await page
      .getByRole("textbox", { name: "Serial Number" })
      .fill(serialNumber);
    await page.getByRole("textbox", { name: "Model Number" }).fill(modelNumber);
    await page.getByRole("textbox", { name: "Part Number" }).fill(partNumber);
    // Fill contact points - Phone
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByPlaceholder("Enter phone number").first().fill(phoneNumber);

    // Save the device
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Search and open the device
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Verify all filled information is displayed
    await expect(page.getByRole("heading", { name: deviceName })).toBeVisible();
    await expect(page.getByText(userFriendlyName)).toBeVisible();
    await expect(page.getByText(identifier)).toBeVisible();
    await expect(page.getByText(manufacturer)).toBeVisible();
    await expect(page.getByText(lotNumber)).toBeVisible();
    await expect(page.getByText(serialNumber)).toBeVisible();
    await expect(page.getByText(modelNumber)).toBeVisible();
    await expect(page.getByText(partNumber)).toBeVisible();
    await expect(page.getByText(status)).toBeVisible();
    await expect(
      page.getByText(availabilityStatus, { exact: true }),
    ).toBeVisible();

    // Verify contact information in the Contact Information card
    await expect(page.getByRole("link", { name: phoneNumber })).toBeVisible();

    // Click Edit button and verify all data is present in the form
    await page.getByRole("button", { name: "Edit" }).click();

    // Verify all fields contain the correct data
    await expect(
      page.getByRole("textbox", { name: "Registered Name *" }),
    ).toHaveValue(deviceName);
    await expect(
      page.getByRole("textbox", { name: "User Friendly Name" }),
    ).toHaveValue(userFriendlyName);
    await expect(
      page.getByRole("combobox", { name: "Status *", exact: true }),
    ).toHaveText(status);
    await expect(
      page.getByRole("combobox", {
        name: "Availability Status *",
        exact: true,
      }),
    ).toHaveText(availabilityStatus);
    await expect(page.getByRole("textbox", { name: "Identifier" })).toHaveValue(
      identifier,
    );
    await expect(
      page.getByRole("textbox", { name: "Manufacturer" }),
    ).toHaveValue(manufacturer);
    await expect(page.getByRole("textbox", { name: "Lot Number" })).toHaveValue(
      lotNumber,
    );
    await expect(
      page.getByRole("textbox", { name: "Serial Number" }),
    ).toHaveValue(serialNumber);
    await expect(
      page.getByRole("textbox", { name: "Model Number" }),
    ).toHaveValue(modelNumber);
    await expect(
      page.getByRole("textbox", { name: "Part Number" }),
    ).toHaveValue(partNumber);
  });

  test("Show validation error when clicking Save without filling required field", async ({
    page,
  }) => {
    // Navigate to Add Device form
    await page.getByRole("link", { name: "Add Device" }).click();

    // Wait for form to be ready by checking Save button visibility
    const saveButton = page.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeVisible({ timeout: 10000 });

    // Fill User Friendly Name to enable the Save button
    const userFriendlyName = faker.word.words(2);
    await page
      .getByRole("textbox", { name: "User Friendly Name" })
      .fill(userFriendlyName);

    // Scroll to Save button and click it without filling the required Registered Name field
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click();

    // Verify error message for Registered Name field
    const registeredNameLabel = page.getByLabel("Registered Name");
    const registeredNameError = page
      .locator('[data-slot="form-item"]')
      .filter({ has: registeredNameLabel })
      .getByText("This field is required");
    await expect(registeredNameError).toBeVisible();
  });
});
