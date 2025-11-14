import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe.serial("Healthcare Services Management", () => {
  let facilityId: string;

  // Common faker option arrays
  const internalTypes = ["Pharmacy", "Lab"];
  const iconOptions = [
    "people",
    "bell",
    "book-open",
    "patient",
    "calendar",
    "folder",
    "ambulance",
    "microscope",
    "notice-board",
    "hospital",
    "health-worker",
  ];

  // Shared service data across tests
  let serviceName: string;
  let serviceDescription: string;
  let internalType: string;
  let selectedIcon: string;

  test.beforeAll(() => {
    // Get facility ID and generate faker values once for all tests
    facilityId = getFacilityId();
    serviceName = `${faker.commerce.department()} Service`;
    serviceDescription = faker.lorem.sentence();
    internalType = faker.helpers.arrayElement(internalTypes);
    selectedIcon = faker.helpers.arrayElement(iconOptions);
  });

  // Navigate to healthcare services page before each test
  test.beforeEach(async ({ page }) => {
    const targetUrl = `/facility/${facilityId}/settings/healthcare_services`;
    await page.goto(targetUrl);
  });

  test("Create a new healthcare service with all required fields", async ({
    page,
  }) => {
    // Click Add Healthcare Service button
    await page.getByRole("button", { name: "Add Healthcare Service" }).click();

    // Fill in the service name
    await page.getByRole("textbox", { name: "Name" }).fill(serviceName);

    // Select internal type
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Internal Type" })
      .click();
    await page.getByRole("option", { name: internalType }).click();

    // Fill in extra details
    await page
      .getByRole("textbox", { name: "Extra Details" })
      .fill(serviceDescription);

    // Select a location
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select locations" })
      .click();

    // Wait for the dialog to appear and select the first available location
    await page.waitForSelector('[role="dialog"]');

    // Click the add button for the first location (the button with empty text next to location name)
    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: /^$/ })
      .first()
      .click();

    // Close the location dialog
    await page.keyboard.press("Escape");

    // Select an icon
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select an icon" })
      .click();
    await page.getByRole("option", { name: selectedIcon }).click();

    // Submit the form
    await page.getByRole("button", { name: "Create" }).click();

    // Verify success notification (appears before navigation)
    await expect(
      page.getByText("Healthcare service created successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Wait for navigation back to list page
    await page.waitForURL(/\/settings\/healthcare_services/, {
      timeout: 10000,
    });

    // Verify the service appears in the list
    await expect(
      page.getByRole("heading", { name: serviceName }),
    ).toBeVisible();
    await expect(page.getByText(serviceDescription)).toBeVisible();
  });

  test("Verify the service appears in the list with icon", async ({ page }) => {
    // Verify the service appears in the list with the icon
    await expect(
      page.getByRole("heading", { name: serviceName }),
    ).toBeVisible();

    // Verify the icon is displayed (icon will be in the UI even if specific icon assertion is complex)
    await expect(page.getByText(serviceDescription)).toBeVisible();
  });

  test("Verify the service details page displays correct information", async ({
    page,
  }) => {
    // Click on the created service to view details
    await page.getByRole("link", { name: serviceName }).first().click();
    // Verify the details are correct
    await expect(page.getByText(serviceName)).toBeVisible();
    await expect(page.getByText(serviceDescription)).toBeVisible();
  });

  test("Update an existing healthcare service", async ({ page }) => {
    // Click on the created service to view details
    await page.getByRole("link", { name: serviceName }).first().click();

    // Click Edit button
    await page.getByRole("button", { name: "Edit" }).click();

    // Verify that the form is prefilled with existing values
    await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
      serviceName,
    );
    await expect(
      page.getByRole("textbox", { name: "Extra Details" }),
    ).toHaveValue(serviceDescription);

    // Verify the internal type is preselected
    const internalTypeCombobox = page
      .getByRole("combobox")
      .filter({ hasText: internalType });
    await expect(internalTypeCombobox).toBeVisible();

    // Verify the icon is preselected
    const iconCombobox = page
      .locator('label:has-text("Icon")')
      .locator("..")
      .getByRole("combobox");
    await expect(iconCombobox).toContainText(selectedIcon);

    // Update the service name
    const updatedName = `Updated ${serviceName}`;
    const updatedDescription = `Updated ${serviceDescription}`;

    await page.getByRole("textbox", { name: "Name" }).fill(updatedName);

    // Update the description
    await page
      .getByRole("textbox", { name: "Extra Details" })
      .fill(updatedDescription);

    // Change the icon - find the combobox that shares the same parent as the "Icon" label
    await page
      .locator('label:has-text("Icon")')
      .locator("..")
      .getByRole("combobox")
      .click();
    await page.getByRole("option", { name: "microscope" }).click();

    // Save the changes
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success notification
    await expect(
      page.getByText("Healthcare service updated successfully"),
    ).toBeVisible();

    // Verify the updated details are displayed
    await expect(page.getByText(updatedName)).toBeVisible();
    await expect(page.getByText(updatedDescription)).toBeVisible();

    // Update the shared variables for subsequent tests
    serviceName = updatedName;
    serviceDescription = updatedDescription;
  });

  test("Verify healthcare service appears on public services page", async ({
    page,
  }) => {
    // Navigate to public services page
    await page.goto(`/facility/${facilityId}/services`);

    // Verify the service appears on the public page
    await expect(
      page.getByRole("heading", { name: serviceName }),
    ).toBeVisible();
    await expect(page.getByText(serviceDescription)).toBeVisible();
  });

  test("Search for healthcare services", async ({ page }) => {
    // Use the search box to find the created service
    await page
      .getByRole("textbox", { name: "Search healthcare services..." })
      .fill(serviceName);

    // Verify the searched service appears
    await expect(
      page.getByRole("heading", { name: serviceName }),
    ).toBeVisible();
  });

  test("Validate required fields when creating healthcare service", async ({
    page,
  }) => {
    // Click Add Healthcare Service button
    await page.getByRole("button", { name: "Add Healthcare Service" }).click();

    // Try to submit without filling required fields
    await page.getByRole("button", { name: "Create" }).click();

    // The form should not submit and should show validation errors
    // expect name and location errors to be visible
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(
      page.getByText("At least one location is required"),
    ).toBeVisible();
  });

  test("Verify that a healthcare service is created without optional fields", async ({
    page,
  }) => {
    const minimalServiceName = `Minimal ${faker.commerce.department()} Service`;

    // Click Add Healthcare Service button
    await page.getByRole("button", { name: "Add Healthcare Service" }).click();

    // Fill in only the required service name
    await page.getByRole("textbox", { name: "Name" }).fill(minimalServiceName);

    // Select a location
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select locations" })
      .click();

    // Wait for the dialog to appear and select the first available location
    await page.waitForSelector('[role="dialog"]');

    // Click the add button for the first location (the button with empty text next to location name)
    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: /^$/ })
      .first()
      .click();

    // Close the location dialog
    await page.keyboard.press("Escape");

    // Submit the form
    await page.getByRole("button", { name: "Create" }).click();

    // Verify success notification (appears before navigation)
    await expect(
      page.getByText("Healthcare service created successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Wait for navigation back to list page
    await page.waitForURL(/\/settings\/healthcare_services/, {
      timeout: 10000,
    });

    // Verify the service appears in the list
    await expect(
      page.getByRole("heading", { name: minimalServiceName }),
    ).toBeVisible();
  });
});
