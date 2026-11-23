import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { selectComboboxOption } from "tests/helper/ui";
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

  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    const whitespace = "   ";
    const addContactPoint = async (system: string) => {
      await page.getByRole("button", { name: "Add Contact Point" }).click();
      // A new contact point row defaults to the "Phone" system.
      await page
        .getByRole("combobox")
        .filter({ hasText: /^Phone$/ })
        .click();
      await page.getByRole("option", { name: system, exact: true }).click();
      // Let the list close fully so the next row's list is the only one.
      await expect(page.getByRole("listbox")).toHaveCount(0);
    };

    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);

    await test.step("Add a pager contact point", async () => {
      await addContactPoint("Pager");
      await page.getByPlaceholder("Enter pager number").fill(whitespace);
    });

    await test.step("Add an other contact point", async () => {
      await addContactPoint("Other");
      await page.getByPlaceholder("Enter contact value").fill(whitespace);
    });

    await page.getByRole("button", { name: "Save" }).click();

    const pagerError = getFieldErrorMessage(
      page.getByPlaceholder("Enter pager number"),
    );
    await expect(pagerError).toBeVisible();
    await expect(pagerError).toHaveText(
      "Must be at least 1 characters and at most 20 characters",
    );

    const otherError = getFieldErrorMessage(
      page.getByPlaceholder("Enter contact value"),
    );
    await expect(otherError).toBeVisible();
    await expect(otherError).toHaveText("Required");
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

  test.describe("Contact type switching", () => {
    // Contact type selects have no label, so match them by the selected type.
    const contactType = (page: Page, index: number) =>
      page
        .getByRole("combobox")
        .filter({ hasText: /^(Phone|Fax|Email|Pager|URL|SMS|Other)$/ })
        .nth(index);
    const contactRow = (page: Page, index: number) =>
      contactType(page, index).locator("../..");
    const contactValue = (page: Page, index: number) =>
      contactRow(page, index).getByRole("textbox");
    const contactError = (page: Page, index: number) =>
      contactRow(page, index).locator('[data-slot="form-message"]');

    const selectContactType = async (
      page: Page,
      index: number,
      type: string,
    ) => {
      await selectComboboxOption(contactType(page, index), {
        name: type,
        exact: true,
      });
      await expect(contactType(page, index)).toHaveText(type);
    };

    const addContact = async (
      page: Page,
      index: number,
      type: string,
      value: string,
    ) => {
      await page.getByRole("button", { name: "Add Contact Point" }).click();
      await selectContactType(page, index, type);
      await contactValue(page, index).fill(value);
    };

    test.beforeEach(async ({ page }) => {
      await page.getByRole("link", { name: "Add Device" }).click();
    });

    test("Clear the value and error when switching between phone and non-phone types", async ({
      page,
    }) => {
      await addContact(page, 0, "Email", "invalid-email");
      await expect(contactError(page, 0)).toHaveText("Invalid email address");

      await selectContactType(page, 0, "Phone");
      await expect(contactValue(page, 0)).toHaveValue("");
      await expect(contactError(page, 0)).toBeHidden();

      await contactValue(page, 0).fill("123");
      await expect(contactError(page, 0)).toHaveText(
        "Entered phone number is not valid",
      );

      await selectContactType(page, 0, "Email");
      await expect(contactValue(page, 0)).toHaveValue("");
      await expect(contactError(page, 0)).toBeHidden();
    });

    test("Validate a kept value against the new contact type", async ({
      page,
    }) => {
      await test.step("Email to URL shows the URL error", async () => {
        await addContact(page, 0, "Email", "invalid-email");
        await expect(contactError(page, 0)).toHaveText("Invalid email address");

        await selectContactType(page, 0, "URL");
        await expect(contactValue(page, 0)).toHaveValue("invalid-email");
        await expect(contactError(page, 0)).toHaveText("Invalid URL");
      });

      await test.step("URL to Other clears the error for a valid value", async () => {
        await selectContactType(page, 0, "Other");
        await expect(contactValue(page, 0)).toHaveValue("invalid-email");
        await expect(contactError(page, 0)).toBeHidden();
      });

      await test.step("Phone to SMS keeps the phone error", async () => {
        await selectContactType(page, 0, "Phone");
        await contactValue(page, 0).fill("123");
        await expect(contactError(page, 0)).toHaveText(
          "Entered phone number is not valid",
        );

        await selectContactType(page, 0, "SMS");
        await expect(contactError(page, 0)).toHaveText(
          "Entered phone number is not valid",
        );
      });
    });

    test("Keep the duplicate error when switching contact type", async ({
      page,
    }) => {
      const email = "duplicate@example.com";
      await addContact(page, 0, "Email", email);
      await addContact(page, 1, "Email", email);
      await expect(contactError(page, 1)).toHaveText(
        "Duplicate contact values are not allowed across different contact types",
      );

      await selectContactType(page, 1, "Other");
      await expect(contactValue(page, 1)).toHaveValue(email);
      await expect(contactError(page, 1)).toHaveText(
        "Duplicate contact values are not allowed across different contact types",
      );
    });

    test("Keep other contact rows' errors when switching one row's type", async ({
      page,
    }) => {
      await addContact(page, 0, "Email", "invalid-email-1");
      await addContact(page, 1, "Email", "invalid-email-2");
      await expect(contactError(page, 0)).toHaveText("Invalid email address");
      await expect(contactError(page, 1)).toHaveText("Invalid email address");

      await selectContactType(page, 0, "Phone");
      await expect(contactError(page, 0)).toBeHidden();
      await expect(contactError(page, 1)).toHaveText("Invalid email address");
    });
  });
});
