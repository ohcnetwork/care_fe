import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Location Creation", () => {
  // Common faker option arrays for all tests
  const locationTypes = [
    "Building",
    "Ward",
    "Level",
    "Vehicle",
    "Virtual",
    "Site",
  ];
  const statusOptions = ["Active", "Inactive", "Unknown"];
  const operationalStatusOptions = [
    "Closed",
    "Housekeeping",
    "Isolated",
    "Contaminated",
    "Operational",
    "Unoccupied",
  ];

  // Common faker constants for all tests
  const location = faker.helpers.arrayElement(locationTypes);
  const locationName = faker.company.name();
  const locationDescription = faker.lorem.sentence();
  const status = faker.helpers.arrayElement(statusOptions);
  const operationalStatus = faker.helpers.arrayElement(
    operationalStatusOptions,
  );

  // Common navigation before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();
    const currentUrl = page.url();
    const lastSlashIndex = currentUrl.lastIndexOf("/");
    const baseUrl = currentUrl.substring(0, lastSlashIndex);
    const targetUrl = `${baseUrl}/settings/locations`;
    await page.goto(targetUrl);
  });

  test("Add a new location with mandatory fields", async ({ page }) => {
    await page.getByRole("button", { name: "Add Location" }).click();

    // Select location type (mandatory field)
    await page.getByRole("combobox", { name: "Location Form" }).click();
    await page.getByRole("option", { name: location }).click();

    // Fill location name (mandatory field)
    await page.getByRole("textbox", { name: "Name" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(locationName);

    // Note: Description is intentionally skipped as it's optional

    // Select status (mandatory field)
    await page.getByRole("combobox", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: status }).first().click();

    // Select operational status (mandatory field)
    await page.getByRole("combobox", { name: "Operational Status" }).click();
    await page.getByRole("option", { name: operationalStatus }).first().click();

    // Submit the form
    await page.getByRole("button", { name: "Create" }).click();

    // Verify location appears in search results
    await page.getByPlaceholder("Search by name").click();
    await page.getByPlaceholder("Search by name").fill(locationName);

    // Assert that all entered data is correctly displayed
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(locationName);
    await expect(tableBody).toContainText(status);
    await expect(tableBody).toContainText(location);
  });

  test("Add a new location with all fields", async ({ page }) => {
    // Open the location creation form
    await page.getByRole("button", { name: "Add Location" }).click();

    // Select location type (mandatory field)
    await page.getByRole("combobox", { name: "Location Form" }).click();
    await page.getByRole("option", { name: location }).click();

    // Fill location name (mandatory field)
    await page.getByRole("textbox", { name: "Name" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(locationName);

    // Fill description field (optional field - testing that optional fields work)
    await page.getByRole("textbox", { name: "Description" }).click();
    await page
      .getByRole("textbox", { name: "Description" })
      .fill(locationDescription);

    // Select status (mandatory field)
    await page.getByRole("combobox", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: status }).first().click();

    // Select operational status (mandatory field)
    await page.getByRole("combobox", { name: "Operational Status" }).click();
    await page.getByRole("option", { name: operationalStatus }).first().click();

    // Submit the form
    await page.getByRole("button", { name: "Create" }).click();

    // Verify location appears in search results
    await page.getByPlaceholder("Search by name").click();
    await page.getByPlaceholder("Search by name").fill(locationName);

    // Assert that all entered data is correctly displayed
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(locationName);
    await expect(tableBody).toContainText(status);
    await expect(tableBody).toContainText(location);
  });

  test("Modify an existing location and verify its updates", async ({
    page,
  }) => {
    // Click the first edit button (pencil icon) to open edit form
    await page.locator("button:has(.lucide-pen-line)").first().click();

    // Update location name with new random value
    await page.getByRole("textbox", { name: "Name" }).click();
    await page.getByRole("textbox", { name: "Name" }).clear();
    await page.getByRole("textbox", { name: "Name" }).fill(locationName);

    // Update description with new random value
    await page.getByRole("textbox", { name: "Description" }).click();
    await page.getByRole("textbox", { name: "Description" }).clear();
    await page
      .getByRole("textbox", { name: "Description" })
      .fill(locationDescription);

    // Update status with new random selection
    await page.getByRole("combobox", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: status }).first().click();

    // Update operational status with new random selection
    await page.getByRole("combobox", { name: "Operational Status" }).click();
    await page.getByRole("option", { name: operationalStatus }).first().click();

    // Submit the updated form
    await page.getByRole("button", { name: "Update" }).click();

    // Search for the updated location to verify changes were saved
    await page.getByPlaceholder("Search by name").click();
    await page.getByPlaceholder("Search by name").fill(locationName);

    // Assert that all updated data is correctly displayed in the table
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(locationName);
    await expect(tableBody).toContainText(status);
  });

  test("Validate location create button is disabled when mandatory fields are empty", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add Location" }).click();

    // Verify that the name field is empty and only mandatory required field now
    const nameTextbox = page.getByRole("textbox", { name: "Name" });
    await expect(nameTextbox).toHaveValue("");

    // Verify that Create button is disabled when mandatory fields are empty
    const createButton = page.getByRole("button", { name: "Create" });
    await expect(createButton).toBeDisabled();
  });

  test("Verify the existing datas are properly visible in edit form", async ({
    page,
  }) => {
    await page.locator("button:has(.lucide-pen-line)").first().click();

    // Check if the Location Form combobox is disabled
    const locationFormCombobox = page.getByRole("combobox", {
      name: "Location Form",
    });
    await expect(locationFormCombobox).toBeDisabled();

    // Check if the Name textbox is filled with some existing location name (not empty)
    const nameTextbox = page.getByRole("textbox", { name: "Name" });
    await expect(nameTextbox).not.toBeEmpty();

    // Check if the Status combobox has some value selected (not empty)
    const statusCombobox = page.getByRole("combobox", {
      name: "Status",
      exact: true,
    });
    await expect(statusCombobox).not.toBeEmpty();

    // Check if the Operational Status combobox has some value selected (not empty)
    const operationalStatusCombobox = page.getByRole("combobox", {
      name: "Operational Status",
      exact: true,
    });
    await expect(operationalStatusCombobox).not.toBeEmpty();

    // Check if the Update button is enabled
    const updateButton = page.getByRole("button", { name: "Update" });
    await expect(updateButton).toBeDisabled();
  });
});
