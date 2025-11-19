import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Location Edit", () => {
  let facilityId: string;
  const statusOptions = ["Active", "Inactive", "Unknown"];
  const operationalStatusOptions = [
    "Closed",
    "Housekeeping",
    "Isolated",
    "Contaminated",
    "Operational",
    "Unoccupied",
  ];

  let locationDescription: string;
  let status: string;
  let operationalStatus: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    locationDescription = faker.lorem.sentence();
    status = faker.helpers.arrayElement(statusOptions);
    operationalStatus = faker.helpers.arrayElement(operationalStatusOptions);

    await page.goto(`/facility/${facilityId}/settings/locations`);
  });

  test("Modify an existing location and verify its updates", async ({
    page,
  }) => {
    // Click the first edit button (pencil icon) to open edit form
    await page.locator("button[title='Edit Location']").first().click();

    // Get the existing location name for later use
    const nameTextbox = page.getByRole("textbox", { name: "Name" });
    const existingLocationName = await nameTextbox.inputValue();

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

    // Search for the location to verify changes were saved
    await page
      .getByRole("textbox", { name: "Search by name" })
      .fill(existingLocationName);

    // Assert that all updated data is correctly displayed in the table
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(existingLocationName);
    await expect(tableBody).toContainText(status);

    // Verify the updated data is correctly displayed in edit form
    await page.locator("button[title='Edit Location']").first().click();

    // Verify all updated values are correctly saved and displayed
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
});
