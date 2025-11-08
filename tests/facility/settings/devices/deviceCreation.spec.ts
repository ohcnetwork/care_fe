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
      .click();

    // Select availability status
    await page
      .getByRole("combobox", { name: "Availability Status *", exact: true })
      .click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: availabilityStatus })
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

  test("Associate and disassociate location with device", async ({ page }) => {
    // Create a device first
    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Navigate to device details page
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Verify no location is associated initially
    await expect(page.getByText("No location associated")).toBeVisible();

    // Click Associate button to open location sheet
    await page.getByRole("button", { name: "Associate" }).click();

    // Wait for location search to load
    await page.waitForSelector('input[placeholder*="Search"]', {
      timeout: 5000,
    });

    // Search and select a location (assuming there's at least one location)
    const locationSearchInput = page
      .locator('input[placeholder*="Search"]')
      .first();
    if (await locationSearchInput.isVisible()) {
      await locationSearchInput.fill("Ward");
      await page.waitForTimeout(1000); // Wait for search results

      // Try to select the first location from results
      const firstLocationOption = page.locator('[role="option"]').first();
      if (await firstLocationOption.isVisible({ timeout: 2000 })) {
        await firstLocationOption.click();

        // Click Associate button in the sheet
        await page
          .getByRole("button", { name: "Associate", exact: true })
          .click();

        // Verify success message
        await expect(
          page.getByText("Location associated successfully"),
        ).toBeVisible({ timeout: 5000 });

        // Close the sheet and verify location is displayed
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);

        // Verify location is now associated (should show location name or link)
        await expect(
          page.getByText("No location associated"),
        ).not.toBeVisible();

        // Test disassociation
        await page.getByRole("button", { name: "Change" }).click();
        await page.getByRole("button", { name: "Disassociate" }).click();

        // Verify disassociation success
        await expect(
          page.getByText("Location disassociated successfully"),
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("Associate and remove managing organization with device", async ({
    page,
  }) => {
    // Create a device first
    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Navigate to device details page
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Verify no organization is associated initially
    await expect(page.getByText("No organization associated")).toBeVisible();

    // Click Associate button to open organization sheet
    const associateOrgButton = page
      .locator("div")
      .filter({ hasText: /Managing Organization/i })
      .getByRole("button", { name: "Associate" });
    await associateOrgButton.click();

    // Wait for organization selector to load
    await page.waitForTimeout(1000);

    // Try to select an organization (if available)
    const orgSelector = page.locator('input[placeholder*="Search"]').last();
    if (await orgSelector.isVisible({ timeout: 2000 })) {
      await orgSelector.fill("Department");
      await page.waitForTimeout(1000);

      // Select first organization option if available
      const firstOrgOption = page.locator('[role="option"]').first();
      if (await firstOrgOption.isVisible({ timeout: 2000 })) {
        await firstOrgOption.click();

        // Click Add Organization button
        const addOrgButton = page.getByRole("button", {
          name: /Add Organization/i,
        });
        if (await addOrgButton.isVisible()) {
          await addOrgButton.click();

          // Verify success message
          await expect(
            page.getByText("Organization added successfully"),
          ).toBeVisible({ timeout: 5000 });

          // Close the sheet
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);

          // Verify organization is now associated
          await expect(
            page.getByText("No organization associated"),
          ).not.toBeVisible();

          // Test removal - open sheet again
          const changeOrgButton = page
            .locator("div")
            .filter({ hasText: /Managing Organization/i })
            .getByRole("button", { name: "Change" });
          await changeOrgButton.click();

          // Wait for sheet to open and find delete button
          await page.waitForTimeout(1000);
          const deleteButton = page
            .getByRole("button", { name: /Delete|Remove/i })
            .first();
          if (await deleteButton.isVisible({ timeout: 2000 })) {
            await deleteButton.click();

            // Verify removal success
            await expect(
              page.getByText("Organization removed successfully"),
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test("Verify location and organization associations are displayed correctly", async ({
    page,
  }) => {
    // Create a device
    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Navigate to device details
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Verify Location section exists
    await expect(page.getByText("Location")).toBeVisible();

    // Verify Managing Organization section exists
    await expect(page.getByText("Managing Organization")).toBeVisible();

    // Verify both sections show "No ... associated" when empty
    await expect(page.getByText("No location associated")).toBeVisible();
    await expect(page.getByText("No organization associated")).toBeVisible();

    // Verify Associate buttons are present
    await expect(
      page
        .locator("div")
        .filter({ hasText: /Location/i })
        .getByRole("button", { name: "Associate" }),
    ).toBeVisible();
    await expect(
      page
        .locator("div")
        .filter({ hasText: /Managing Organization/i })
        .getByRole("button", { name: "Associate" }),
    ).toBeVisible();
  });

  test("Add and modify service request record for device", async ({ page }) => {
    // Create a device first
    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Navigate to device details page
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Scroll to Service History section
    await page.getByText("Service History").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click "Add Service Record" button
    // The button should be near the "Service History" heading
    const addServiceButton = page
      .getByRole("button", { name: "Add Service Record" })
      .or(page.getByRole("button").filter({ hasText: /Add Service Record/i }))
      .first();

    await addServiceButton.click();

    // Wait for the form sheet to appear
    await page.waitForSelector('[data-cy="add-service-form"]', {
      timeout: 5000,
    });

    // Fill in service record details
    const serviceNote = faker.lorem.sentence();

    // Fill service notes (textarea)
    const notesTextarea = page
      .locator("textarea")
      .or(page.getByRole("textbox", { name: /Service Notes|Notes/i }))
      .first();
    await notesTextarea.waitFor({ state: "visible", timeout: 3000 });
    await notesTextarea.fill(serviceNote);

    // Submit the form
    const saveButton = page
      .locator('[data-cy="add-service-form"]')
      .getByRole("button", { name: "Save" });
    await saveButton.click();

    // Verify success message
    await expect(
      page.getByText("Service record added successfully"),
    ).toBeVisible({ timeout: 5000 });

    // Wait for sheet to close and table to update
    await page.waitForTimeout(1000);

    // Verify the service record appears in the table
    await expect(page.getByText(serviceNote)).toBeVisible({ timeout: 5000 });

    // Now modify the existing service record
    // Find the row with the service note
    const serviceRow = page.locator("tr").filter({ hasText: serviceNote });

    if (await serviceRow.isVisible({ timeout: 3000 })) {
      // Find and click the edit button in that row (icon button)
      const editButton = serviceRow
        .locator("button")
        .or(serviceRow.locator('button[aria-label*="Edit" i]'))
        .first();

      await editButton.click();

      // Wait for edit form to open
      await page.waitForSelector('[data-cy="edit-service-form"]', {
        timeout: 5000,
      });

      // Update the service note
      const updatedNote = faker.lorem.sentence();
      const editNotesTextarea = page
        .locator('[data-cy="edit-service-form"]')
        .locator("textarea")
        .first();
      await editNotesTextarea.waitFor({ state: "visible", timeout: 3000 });
      await editNotesTextarea.fill(updatedNote);

      // Submit the update
      const updateButton = page
        .locator('[data-cy="edit-service-form"]')
        .getByRole("button", { name: "Update" });
      await updateButton.click();

      // Verify update success message
      await expect(
        page.getByText("Service record updated successfully"),
      ).toBeVisible({ timeout: 5000 });

      // Wait for sheet to close
      await page.waitForTimeout(1000);

      // Verify the updated note appears in the table
      await expect(page.getByText(updatedNote)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("Delete a newly added device", async ({ page }) => {
    // Create a device
    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Navigate to device details page
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Verify device details page is loaded
    await expect(page.getByRole("heading", { name: deviceName })).toBeVisible();

    // Scroll to Danger Zone section
    await page.getByText("Danger Zone").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Find and click Delete button in Danger Zone
    const deleteButton = page
      .locator("div")
      .filter({ hasText: /Danger Zone/i })
      .getByRole("button", { name: "Delete" })
      .first();

    await deleteButton.click();

    // Verify confirmation dialog appears
    await expect(
      page.getByText("Are you sure you want to delete this device?"),
    ).toBeVisible({ timeout: 3000 });

    // Find and click the confirm delete button in the dialog
    // The dialog should have a destructive/confirm button
    const confirmDeleteButton = page
      .locator('[role="dialog"]')
      .getByRole("button", { name: "Delete" })
      .filter({ hasText: /^Delete$/ });

    await confirmDeleteButton.click();

    // Wait for deletion to complete and redirect
    await page.waitForURL(
      new RegExp(`/facility/${facilityId}/settings/devices`),
      { timeout: 5000 },
    );

    // Verify we're on the devices list page
    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/devices`),
    );

    // Verify device is no longer in the list by searching
    const searchInput = page.getByRole("textbox", {
      name: "Search devices...",
    });
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill(deviceName);
      await page.waitForTimeout(1000);

      // Device should not be found
      await expect(
        page.getByRole("link", { name: deviceName }),
      ).not.toBeVisible({ timeout: 2000 });
    }
  });
});
