import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Services Management", () => {
  let facilityId: string;

  // Common faker option arrays
  const internalTypes = ["Pharmacy", "Lab", "scheduling"];
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

  // Generate fresh faker constants for each test
  let serviceName: string;
  let serviceDescription: string;
  let internalType: string;
  let selectedIcon: string;

  // Common navigation before each test
  test.beforeEach(async ({ page }) => {
    // Get facility ID for each test run
    facilityId = getFacilityId();

    // Generate fresh faker values for each test
    serviceName = `${faker.commerce.department()} Service`;
    serviceDescription = faker.lorem.sentence();
    internalType = faker.helpers.arrayElement(internalTypes);
    selectedIcon = faker.helpers.arrayElement(iconOptions);

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

    // Submit the form
    await page.getByRole("button", { name: "Create" }).click();

    // Wait for navigation back to list page
    await page.waitForURL(/\/settings\/healthcare_services$/);

    // Verify success notification
    await expect(
      page.getByText("Healthcare service created successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Verify the service appears in the list
    await expect(
      page.getByRole("heading", { name: serviceName }),
    ).toBeVisible();
    await expect(page.getByText(serviceDescription)).toBeVisible();
  });

  test("Create healthcare service with optional icon", async ({ page }) => {
    const serviceNameWithIcon = `${faker.commerce.department()} Clinic`;
    const serviceDescriptionWithIcon = faker.lorem.sentence();

    // Click Add Healthcare Service button
    await page.getByRole("button", { name: "Add Healthcare Service" }).click();

    // Fill in the service name
    await page.getByRole("textbox", { name: "Name" }).fill(serviceNameWithIcon);

    // Select internal type
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Internal Type" })
      .click();
    await page.getByRole("option", { name: "Lab" }).click();

    // Fill in extra details
    await page
      .getByRole("textbox", { name: "Extra Details" })
      .fill(serviceDescriptionWithIcon);

    // Select a location
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select locations" })
      .click();
    await page.waitForSelector('[role="dialog"]');
    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: /^$/ })
      .first()
      .click();
    await page.keyboard.press("Escape");

    // Select an icon
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select an icon" })
      .click();
    await page.getByRole("option", { name: selectedIcon }).click();

    // Submit the form
    await page.getByRole("button", { name: "Create" }).click();

    // Verify success notification
    await expect(
      page.getByText("Healthcare service created successfully"),
    ).toBeVisible();

    // Verify the service appears in the list with the icon
    await expect(
      page.getByRole("heading", { name: serviceNameWithIcon }),
    ).toBeVisible();
  });

  test("Update an existing healthcare service", async ({ page }) => {
    // First create a service to update
    const originalName = `${faker.commerce.department()} Department`;
    const originalDescription = faker.lorem.sentence();

    await page.getByRole("button", { name: "Add Healthcare Service" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(originalName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Internal Type" })
      .click();
    await page.getByRole("option", { name: "Pharmacy" }).click();
    await page
      .getByRole("textbox", { name: "Extra Details" })
      .fill(originalDescription);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select locations" })
      .click();
    await page.waitForSelector('[role="dialog"]');
    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: /^$/ })
      .first()
      .click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Create" }).click();

    // Wait for success notification
    await expect(
      page.getByText("Healthcare service created successfully"),
    ).toBeVisible();

    // Click on the newly created service to view details
    await page.getByRole("link", { name: originalName }).first().click();

    // Click Edit button
    await page.getByRole("button", { name: "Edit" }).click();

    // Update the service name
    const updatedName = `Updated ${originalName}`;
    const updatedDescription = `Updated ${originalDescription}`;

    await page.getByRole("textbox", { name: "Name" }).clear();
    await page.getByRole("textbox", { name: "Name" }).fill(updatedName);

    // Update the description
    await page.getByRole("textbox", { name: "Extra Details" }).clear();
    await page
      .getByRole("textbox", { name: "Extra Details" })
      .fill(updatedDescription);

    // Add an icon if not already set
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select an icon" })
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
  });

  test("Verify healthcare service appears on public services page", async ({
    page,
  }) => {
    // Create a new service
    const publicServiceName = `${faker.commerce.department()} Center`;
    const publicServiceDescription = faker.lorem.sentence();

    await page.getByRole("button", { name: "Add Healthcare Service" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(publicServiceName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Internal Type" })
      .click();
    await page.getByRole("option", { name: "Lab" }).click();
    await page
      .getByRole("textbox", { name: "Extra Details" })
      .fill(publicServiceDescription);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select locations" })
      .click();
    await page.waitForSelector('[role="dialog"]');
    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: /^$/ })
      .first()
      .click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Create" }).click();

    // Wait for success notification
    await expect(
      page.getByText("Healthcare service created successfully"),
    ).toBeVisible();

    // Navigate to public services page
    await page.goto(`/facility/${facilityId}/services`);

    // Verify the service appears on the public page
    await expect(
      page.getByRole("heading", { name: publicServiceName }),
    ).toBeVisible();
    await expect(page.getByText(publicServiceDescription)).toBeVisible();
  });

  test("Search for healthcare services", async ({ page }) => {
    // Create a unique service for search testing
    const uniqueServiceName = `Search Test ${faker.string.alphanumeric(8)}`;

    await page.getByRole("button", { name: "Add Healthcare Service" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(uniqueServiceName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Internal Type" })
      .click();
    await page.getByRole("option", { name: "Pharmacy" }).click();
    await page
      .getByRole("textbox", { name: "Extra Details" })
      .fill("Test search functionality");
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select locations" })
      .click();
    await page.waitForSelector('[role="dialog"]');
    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: /^$/ })
      .first()
      .click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Create" }).click();

    // Wait for success notification
    await expect(
      page.getByText("Healthcare service created successfully"),
    ).toBeVisible();

    // Use the search box
    await page
      .getByRole("textbox", { name: "Search healthcare services..." })
      .fill(uniqueServiceName);

    // Verify the searched service appears
    await expect(
      page.getByRole("heading", { name: uniqueServiceName }),
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
    // We should still be on the create page
    await expect(
      page.getByRole("heading", { name: "Create Healthcare Service" }),
    ).toBeVisible();
  });
});
