import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Location Creation", () => {
  let facilityId: string;
  // Common faker option arrays for all below tests
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

  // Generate the fresh faker constants for each test
  let location: string;
  let locationName: string;
  let locationDescription: string;
  let status: string;
  let operationalStatus: string;

  // Common navigation before each test
  test.beforeEach(async ({ page }) => {
    // Get facility ID for each test run
    facilityId = getFacilityId();

    // Generate fresh faker values for each test
    location = faker.helpers.arrayElement(locationTypes);
    locationName = faker.company.name();
    locationDescription = faker.lorem.sentence();
    status = faker.helpers.arrayElement(statusOptions);
    operationalStatus = faker.helpers.arrayElement(operationalStatusOptions);

    const targetUrl = `/facility/${facilityId}/settings/locations`;
    await page.goto(targetUrl);
  });

  test("Add a new location with mandatory fields", async ({ page }) => {
    await page.getByRole("button", { name: "Add Location" }).click();

    // Select location form (mandatory field)
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

    // Assert that all entered data is correctly displayed in edit slideover
    await page.locator("button[title='Edit Location']").first().click();

    // Verify that Location Form combobox is disabled and has the correct location form
    const locationFormCombobox = page.getByRole("combobox", {
      name: "Location Form",
    });
    await expect(locationFormCombobox).toBeDisabled();
    await expect(locationFormCombobox).toContainText(location);

    // Verify that Name textbox contains the correct location name
    const nameTextbox = page.getByRole("textbox", { name: "Name" });
    await expect(nameTextbox).toHaveValue(locationName);

    // Verify that Description textbox is empty (since we didn't fill it during creation)
    const descriptionTextbox = page.getByRole("textbox", {
      name: "Description",
    });
    await expect(descriptionTextbox).toHaveValue("");

    // Verify that Status combobox contains the correct status
    const statusCombobox = page.getByRole("combobox", {
      name: "Status",
      exact: true,
    });
    await expect(statusCombobox).toContainText(status);

    // Verify that Operational Status combobox contains the correct operational status
    const operationalStatusCombobox = page.getByRole("combobox", {
      name: "Operational Status",
    });
    await expect(operationalStatusCombobox).toContainText(operationalStatus);
  });

  test("Add a new location with all fields", async ({ page }) => {
    // Open the location creation form
    await page.getByRole("button", { name: "Add Location" }).click();

    // Select location form (mandatory field)
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

    // Assert that all entered data is correctly displayed in edit slideover
    await page.locator("button[title='Edit Location']").first().click();

    // Verify that Location Form combobox is disabled and has the correct location form
    const locationFormCombobox = page.getByRole("combobox", {
      name: "Location Form",
    });
    await expect(locationFormCombobox).toBeDisabled();
    await expect(locationFormCombobox).toContainText(location);

    // Verify that Name textbox contains the correct location name
    const nameTextbox = page.getByRole("textbox", { name: "Name" });
    await expect(nameTextbox).toHaveValue(locationName);

    // Verify that Description textbox contains the description (since we filled it during creation)
    const descriptionTextbox = page.getByRole("textbox", {
      name: "Description",
    });
    await expect(descriptionTextbox).toHaveValue(locationDescription);

    // Verify that Status combobox contains the correct status
    const statusCombobox = page.getByRole("combobox", {
      name: "Status",
      exact: true,
    });
    await expect(statusCombobox).toContainText(status);

    // Verify that Operational Status combobox contains the correct operational status
    const operationalStatusCombobox = page.getByRole("combobox", {
      name: "Operational Status",
    });
    await expect(operationalStatusCombobox).toContainText(operationalStatus);
  });

  test("Modify an existing location and verify its updates", async ({
    page,
  }) => {
    // Click the first edit button (pencil icon) to open edit form
    await page.locator("button[title='Edit Location']").first().click();

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

    // Search for the updated location to verify changes were saved
    await page
      .getByRole("textbox", { name: "Search by name" })
      .fill(locationName);

    // Assert that all updated data is correctly displayed in the table
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(locationName);
    await expect(tableBody).toContainText(status);

    // Verify the updated data is correctly displayed in edit form
    await page.locator("button[title='Edit Location']").first().click();

    // Verify all updated values are correctly saved and displayed
    const updatedNameTextbox = page.getByRole("textbox", { name: "Name" });
    await expect(updatedNameTextbox).toHaveValue(locationName);

    const updatedDescriptionTextbox = page.getByRole("textbox", {
      name: "Description",
    });
    await expect(updatedDescriptionTextbox).toHaveValue(locationDescription);

    const updatedStatusCombobox = page.getByRole("combobox", {
      name: "Status",
      exact: true,
    });
    await expect(updatedStatusCombobox).toContainText(status);

    const updatedOperationalStatusCombobox = page.getByRole("combobox", {
      name: "Operational Status",
    });
    await expect(updatedOperationalStatusCombobox).toContainText(
      operationalStatus,
    );
  });

  test("Validate location create button is disabled when mandatory fields are empty", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add Location" }).click();

    // Verify that the name field is empty and is the only mandatory required field now
    const nameTextbox = page.getByRole("textbox", { name: "Name" });
    await expect(nameTextbox).toHaveValue("");

    // Verify that Create button is disabled when mandatory fields are empty
    const createButton = page.getByRole("button", { name: "Create" });
    await expect(createButton).toBeDisabled();
  });
});
