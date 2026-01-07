import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
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

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/locations`);
  });

  test("Add a new location with mandatory fields", async ({ page }) => {
    const location = faker.helpers.arrayElement(locationTypes);
    const locationName = faker.company.name();
    const status = faker.helpers.arrayElement(statusOptions);
    const operationalStatus = faker.helpers.arrayElement(
      operationalStatusOptions,
    );

    await test.step("Create location with mandatory fields", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("combobox", { name: "Location Form" }).click();
      await page.getByRole("option", { name: location }).click();
      await page.getByRole("textbox", { name: "Name" }).fill(locationName);
      await page.getByRole("combobox", { name: "Status", exact: true }).click();
      await page.getByRole("option", { name: status }).first().click();
      await page.getByRole("combobox", { name: "Operational Status" }).click();
      await page
        .getByRole("option", { name: operationalStatus })
        .first()
        .click();
      await page.getByRole("button", { name: "Create" }).click();
    });

    await test.step("Verify location in table", async () => {
      await page
        .getByRole("textbox", { name: "Search by name" })
        .fill(locationName);
      const tableBody = page.locator('[data-slot="table-body"]');
      await expect(tableBody).toContainText(locationName);
      await expect(tableBody).toContainText(status);
      await expect(tableBody).toContainText(location);
    });

    await test.step("Verify location in edit form", async () => {
      await page.locator("button[title='Edit Location']").first().click();

      await expect(
        page.getByRole("combobox", { name: "Location Form" }),
      ).toBeDisabled();
      await expect(
        page.getByRole("combobox", { name: "Location Form" }),
      ).toContainText(location);
      await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
        locationName,
      );
      await expect(
        page.getByRole("textbox", { name: "Description" }),
      ).toHaveValue("");
      await expect(
        page.getByRole("combobox", { name: "Status", exact: true }),
      ).toContainText(status);
      await expect(
        page.getByRole("combobox", { name: "Operational Status" }),
      ).toContainText(operationalStatus);
    });
  });

  test("Add a new location with all fields", async ({ page }) => {
    const location = faker.helpers.arrayElement(locationTypes);
    const locationName = faker.company.name();
    const locationDescription = faker.lorem.sentence();
    const status = faker.helpers.arrayElement(statusOptions);
    const operationalStatus = faker.helpers.arrayElement(
      operationalStatusOptions,
    );

    await test.step("Create location with all fields", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("combobox", { name: "Location Form" }).click();
      await page.getByRole("option", { name: location }).click();
      await page.getByRole("textbox", { name: "Name" }).fill(locationName);
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(locationDescription);
      await page.getByRole("combobox", { name: "Status", exact: true }).click();
      await page.getByRole("option", { name: status }).first().click();
      await page.getByRole("combobox", { name: "Operational Status" }).click();
      await page
        .getByRole("option", { name: operationalStatus })
        .first()
        .click();
      await page.getByRole("button", { name: "Create" }).click();
    });

    await test.step("Verify location in table", async () => {
      await page
        .getByRole("textbox", { name: "Search by name" })
        .fill(locationName);
      const tableBody = page.locator('[data-slot="table-body"]');
      await expect(tableBody).toContainText(locationName);
      await expect(tableBody).toContainText(status);
      await expect(tableBody).toContainText(location);
    });

    await test.step("Verify location in edit form", async () => {
      await page.locator("button[title='Edit Location']").first().click();

      await expect(
        page.getByRole("combobox", { name: "Location Form" }),
      ).toBeDisabled();
      await expect(
        page.getByRole("combobox", { name: "Location Form" }),
      ).toContainText(location);
      await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
        locationName,
      );
      await expect(
        page.getByRole("textbox", { name: "Description" }),
      ).toHaveValue(locationDescription);
      await expect(
        page.getByRole("combobox", { name: "Status", exact: true }),
      ).toContainText(status);
      await expect(
        page.getByRole("combobox", { name: "Operational Status" }),
      ).toContainText(operationalStatus);
    });
  });

  test("Validate location create button is disabled when mandatory fields are empty", async ({
    page,
  }) => {
    await test.step("Open add location dialog", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
    });

    await test.step("Verify create button is disabled", async () => {
      await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("");
      await expect(page.getByRole("button", { name: "Create" })).toBeDisabled();
    });
  });

  test("Add single bed as child location", async ({ page }) => {
    const bedName = faker.company.name();

    await test.step("Open parent location", async () => {
      await page.locator('[data-slot="table-body"] tr').first().click();
    });

    await test.step("Create bed location", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("combobox", { name: "Location Form" }).click();
      await page.getByRole("option", { name: "Bed" }).click();
      await page.getByRole("textbox", { name: "Name" }).fill(bedName);
      await page.getByRole("button", { name: "Create" }).click();
    });

    await test.step("Verify bed created", async () => {
      await expect(
        page.locator("li[data-sonner-toast]").getByText("Location Created"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify bed in child table", async () => {
      await page
        .getByRole("textbox", { name: "Search by name" })
        .last()
        .fill(bedName);
      const tableBody = page.locator('[data-slot="table-body"]').last();
      await expect(tableBody).toContainText(bedName);
      await expect(tableBody).toContainText("Bed");
    });
  });

  test("Add multiple beds as child location", async ({ page }) => {
    const bedBaseName = faker.word.words(1);
    const bedCount = 2;

    await test.step("Open parent location", async () => {
      await page.locator('[data-slot="table-body"] tr').first().click();
    });

    await test.step("Create multiple beds", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("combobox", { name: "Location Form" }).click();
      await page.getByRole("option", { name: "Bed" }).click();
      await page.getByRole("textbox", { name: "Name" }).fill(bedBaseName);
      await page
        .getByRole("checkbox", { name: "Create Multiple Beds" })
        .click();
      await page.getByRole("combobox", { name: "Number of beds" }).click();
      await page
        .getByRole("option", { name: `${bedCount} Beds` })
        .first()
        .click();
      await page.getByRole("button", { name: "Create" }).click();
    });

    await test.step("Verify multiple beds created", async () => {
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(`${bedCount} Beds created successfully`),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify each bed in child table", async () => {
      const childSearchBox = page
        .getByRole("textbox", { name: "Search by name" })
        .last();
      const childTableBody = page.locator('[data-slot="table-body"]').last();

      for (let i = 1; i <= bedCount; i++) {
        await childSearchBox.fill(`${bedBaseName} ${i}`);
        await expect(childTableBody).toContainText(`${bedBaseName} ${i}`);
      }
    });
  });

  test("Verify error when creating bed in root location", async ({ page }) => {
    await test.step("Attempt to create bed at root", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("combobox", { name: "Location Form" }).click();
      await page.getByRole("option", { name: "Bed" }).click();
    });

    await test.step("Verify error message", async () => {
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/Beds can only be created under a parent location/i),
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
