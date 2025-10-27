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

  // Generate fresh faker constants for each test
  let location: string;
  let locationName: string;
  let locationDescription: string;
  let status: string;
  let operationalStatus: string;

  // Common navigation before each test
  test.beforeEach(async ({ page }) => {
    // Generate fresh faker values for each test
    location = faker.helpers.arrayElement(locationTypes);
    locationName = faker.company.name();
    locationDescription = faker.lorem.sentence();
    status = faker.helpers.arrayElement(statusOptions);
    operationalStatus = faker.helpers.arrayElement(operationalStatusOptions);

    await page.goto("/");
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();
    const currentUrl = page.url();
    const urlObj = new URL(currentUrl);
    const match = urlObj.pathname.match(/\/facility\/([^/]+)/);
    if (!match) {
      throw new Error("Could not extract facility ID from URL: " + currentUrl);
    }
    const facilityId = match[1];
    const targetPath = `/facility/${facilityId}/settings/locations`;
    await page.goto(targetPath);
  });

  test("Add a new location with mandatory fields", async ({ page }) => {
    // await page.getByRole("button", { name: "Add Location" }).click();

    // Select location type (mandatory field)
    await page.getByRole("combobox", { name: "Location Form" }).click();
    await page.getByRole("option", { name: location }).click();

    // Fill location name (mandatory field)
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
    await page
      .getByRole("textbox", { name: "Search by name" })
      .fill(locationName);

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
    await page.getByRole("textbox", { name: "Name" }).fill(locationName);

    // Fill description field (optional field - testing that optional fields work)
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
    await page
      .getByRole("textbox", { name: "Search by name" })
      .fill(locationName);

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
    await page.getByRole("textbox", { name: "Name" }).fill(locationName);

    // Update description with new random value
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

    // Search for the updated locationw to verify changes were saved
    await page
      .getByRole("textbox", { name: "Search by name" })
      .fill(locationName);

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

  test("Verify the existing data are properly visible in edit form", async ({
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
    await expect(nameTextbox).not.toHaveValue("");

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

    // Check if the Update button is disabled unless there are changes
    const updateButton = page.getByRole("button", { name: "Update" });
    await expect(updateButton).toBeDisabled();
  });
});
