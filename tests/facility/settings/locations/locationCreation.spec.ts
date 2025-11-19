import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Location Creation", () => {
  let facilityId: string;

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

  let location: string;
  let locationName: string;
  let locationDescription: string;
  let status: string;
  let operationalStatus: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    location = faker.helpers.arrayElement(locationTypes);
    locationName = faker.company.name();
    locationDescription = faker.lorem.sentence();
    status = faker.helpers.arrayElement(statusOptions);
    operationalStatus = faker.helpers.arrayElement(operationalStatusOptions);

    await page.goto(`/facility/${facilityId}/settings/locations`);
  });

  async function openAddLocationDialog(page: Page) {
    await page.getByRole("button", { name: "Add Location" }).click();
  }

  async function selectLocationType(page: Page, locationType: string) {
    await page.getByRole("combobox", { name: "Location Form" }).click();
    await page.getByRole("option", { name: locationType }).click();
  }

  async function fillLocationName(page: Page, name: string) {
    await page.getByRole("textbox", { name: "Name" }).fill(name);
  }

  async function fillLocationDescription(page: Page, description: string) {
    await page.getByRole("textbox", { name: "Description" }).fill(description);
  }

  async function selectStatus(page: Page, statusValue: string) {
    await page.getByRole("combobox", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: statusValue }).first().click();
  }

  async function selectOperationalStatus(
    page: Page,
    operationalStatusValue: string,
  ) {
    await page.getByRole("combobox", { name: "Operational Status" }).click();
    await page
      .getByRole("option", { name: operationalStatusValue })
      .first()
      .click();
  }

  async function submitLocationForm(page: Page) {
    await page.getByRole("button", { name: "Create" }).click();
  }

  async function verifyLocationCreatedNotification(page: Page) {
    await expect(
      page.locator("li[data-sonner-toast]").getByText("Location Created"),
    ).toBeVisible({ timeout: 10000 });
  }

  async function searchLocationByName(page: Page, name: string) {
    await page.getByRole("textbox", { name: "Search by name" }).fill(name);
  }

  async function verifyLocationInTable(
    page: Page,
    name: string,
    statusValue: string,
    locationType: string,
  ) {
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(name);
    await expect(tableBody).toContainText(statusValue);
    await expect(tableBody).toContainText(locationType);
  }

  async function openEditLocation(page: Page) {
    await page.locator("button[title='Edit Location']").first().click();
  }

  async function verifyLocationFormDisabled(page: Page, locationType: string) {
    const locationFormCombobox = page.getByRole("combobox", {
      name: "Location Form",
    });
    await expect(locationFormCombobox).toBeDisabled();
    await expect(locationFormCombobox).toContainText(locationType);
  }

  async function verifyLocationName(page: Page, name: string) {
    const nameTextbox = page.getByRole("textbox", { name: "Name" });
    await expect(nameTextbox).toHaveValue(name);
  }

  async function verifyLocationDescription(page: Page, description: string) {
    const descriptionTextbox = page.getByRole("textbox", {
      name: "Description",
    });
    await expect(descriptionTextbox).toHaveValue(description);
  }

  async function verifyLocationStatus(page: Page, statusValue: string) {
    const statusCombobox = page.getByRole("combobox", {
      name: "Status",
      exact: true,
    });
    await expect(statusCombobox).toContainText(statusValue);
  }

  async function verifyLocationOperationalStatus(
    page: Page,
    operationalStatusValue: string,
  ) {
    const operationalStatusCombobox = page.getByRole("combobox", {
      name: "Operational Status",
    });
    await expect(operationalStatusCombobox).toContainText(
      operationalStatusValue,
    );
  }

  async function openParentLocation(page: Page) {
    await page.locator('[data-slot="table-body"] tr').first().click();
  }

  async function enableBulkBedCreation(page: Page) {
    await page.getByRole("checkbox", { name: "Create Multiple Beds" }).click();
  }

  async function selectNumberOfBeds(page: Page, count: number) {
    await page.getByRole("combobox", { name: "Number of beds" }).click();
    await page
      .getByRole("option", { name: `${count} Beds` })
      .first()
      .click();
  }

  async function verifyMultipleBedsCreatedNotification(
    page: Page,
    count: number,
  ) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText(`${count} Beds created successfully`),
    ).toBeVisible({ timeout: 10000 });
  }

  async function searchChildLocationByName(page: Page, name: string) {
    await page
      .getByRole("textbox", { name: "Search by name" })
      .last()
      .fill(name);
  }

  async function verifyChildLocationInTable(
    page: Page,
    name: string,
    locationType: string,
  ) {
    const tableBody = page.locator('[data-slot="table-body"]').last();
    await expect(tableBody).toContainText(name);
    await expect(tableBody).toContainText(locationType);
  }

  async function verifyErrorMessage(page: Page, message: string | RegExp) {
    await expect(
      page.locator("li[data-sonner-toast]").getByText(message),
    ).toBeVisible({ timeout: 10000 });
  }

  test("Add a new location with mandatory fields", async ({ page }) => {
    await openAddLocationDialog(page);
    await selectLocationType(page, location);
    await fillLocationName(page, locationName);
    await selectStatus(page, status);
    await selectOperationalStatus(page, operationalStatus);
    await submitLocationForm(page);

    await searchLocationByName(page, locationName);
    await verifyLocationInTable(page, locationName, status, location);

    await openEditLocation(page);
    await verifyLocationFormDisabled(page, location);
    await verifyLocationName(page, locationName);
    await verifyLocationDescription(page, "");
    await verifyLocationStatus(page, status);
    await verifyLocationOperationalStatus(page, operationalStatus);
  });

  test("Add a new location with all fields", async ({ page }) => {
    await openAddLocationDialog(page);
    await selectLocationType(page, location);
    await fillLocationName(page, locationName);
    await fillLocationDescription(page, locationDescription);
    await selectStatus(page, status);
    await selectOperationalStatus(page, operationalStatus);
    await submitLocationForm(page);

    await searchLocationByName(page, locationName);
    await verifyLocationInTable(page, locationName, status, location);

    await openEditLocation(page);
    await verifyLocationFormDisabled(page, location);
    await verifyLocationName(page, locationName);
    await verifyLocationDescription(page, locationDescription);
    await verifyLocationStatus(page, status);
    await verifyLocationOperationalStatus(page, operationalStatus);
  });

  test("Validate location create button is disabled when mandatory fields are empty", async ({
    page,
  }) => {
    await openAddLocationDialog(page);

    const nameTextbox = page.getByRole("textbox", { name: "Name" });
    await expect(nameTextbox).toHaveValue("");

    const createButton = page.getByRole("button", { name: "Create" });
    await expect(createButton).toBeDisabled();
  });

  test("Add single bed as child location", async ({ page }) => {
    const bedName = faker.company.name();

    await openParentLocation(page);
    await openAddLocationDialog(page);
    await selectLocationType(page, "Bed");
    await fillLocationName(page, bedName);
    await submitLocationForm(page);

    await verifyLocationCreatedNotification(page);

    await searchChildLocationByName(page, bedName);
    await verifyChildLocationInTable(page, bedName, "Bed");
  });

  test("Add multiple beds as child location", async ({ page }) => {
    const bedBaseName = faker.word.words(1);
    const bedCount = 2;

    await openParentLocation(page);
    await openAddLocationDialog(page);
    await selectLocationType(page, "Bed");
    await fillLocationName(page, bedBaseName);
    await enableBulkBedCreation(page);
    await selectNumberOfBeds(page, bedCount);
    await submitLocationForm(page);

    await verifyMultipleBedsCreatedNotification(page, bedCount);

    const childSearchBox = page
      .getByRole("textbox", { name: "Search by name" })
      .last();
    const childTableBody = page.locator('[data-slot="table-body"]').last();

    for (let i = 1; i <= bedCount; i++) {
      await childSearchBox.fill(`${bedBaseName} ${i}`);
      await expect(childTableBody).toContainText(`${bedBaseName} ${i}`);
    }
  });

  test("Verify error when creating bed in root location", async ({ page }) => {
    await openAddLocationDialog(page);
    await selectLocationType(page, "Bed");

    await verifyErrorMessage(
      page,
      /Beds can only be created under a parent location/i,
    );
  });
});
