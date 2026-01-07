import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Location Edit", () => {
  let facilityId: string;
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

  test("Modify an existing location and verify its updates", async ({
    page,
  }) => {
    const locationName = faker.company.name();
    const updatedDescription = faker.lorem.sentence();
    let newStatus: string;
    let newOperationalStatus: string;

    await test.step("Create a new location", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("textbox", { name: "Name" }).fill(locationName);
      await page.getByRole("button", { name: "Create" }).click();
      await expect(
        page.locator("li[data-sonner-toast]").getByText("Location Created"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Search and open edit form", async () => {
      await page
        .getByRole("textbox", { name: "Search by name" })
        .fill(locationName);
      await page.locator("button[title='Edit Location']").first().click();
    });

    await test.step("Determine different values", async () => {
      const currentStatusText = await page
        .getByRole("combobox", { name: "Status", exact: true })
        .textContent();

      newStatus = currentStatusText?.includes("Active") ? "Inactive" : "Active";

      const currentOperationalStatusText = await page
        .getByRole("combobox", { name: "Operational Status" })
        .textContent();

      newOperationalStatus =
        operationalStatusOptions.find(
          (option) => !currentOperationalStatusText?.includes(option),
        ) || "Closed";
    });

    await test.step("Update location fields", async () => {
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(updatedDescription);

      await page.getByRole("combobox", { name: "Status", exact: true }).click();
      await page.getByRole("option", { name: newStatus }).first().click();

      await page.getByRole("combobox", { name: "Operational Status" }).click();
      await page
        .getByRole("option", { name: newOperationalStatus })
        .first()
        .click();
    });

    await test.step("Submit updated location", async () => {
      await page.getByRole("button", { name: "Update" }).click();
    });

    await test.step("Verify updates in table", async () => {
      await page
        .getByRole("textbox", { name: "Search by name" })
        .fill(locationName);

      const tableBody = page.locator('[data-slot="table-body"]');
      await expect(tableBody).toContainText(locationName);
      await expect(tableBody).toContainText(newStatus);
    });

    await test.step("Verify updates in edit form", async () => {
      await page.locator("button[title='Edit Location']").first().click();

      await expect(
        page.getByRole("textbox", { name: "Description" }),
      ).toHaveValue(updatedDescription);

      await expect(
        page.getByRole("combobox", { name: "Status", exact: true }),
      ).toContainText(newStatus);

      await expect(
        page.getByRole("combobox", { name: "Operational Status" }),
      ).toContainText(newOperationalStatus);
    });
  });
});
