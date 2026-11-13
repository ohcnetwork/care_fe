import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

function locationRow(page: Page, name: string) {
  return page.getByRole("row").filter({
    has: page.getByRole("cell", { name, exact: true }),
  });
}

async function reopenLocation(page: Page, name: string) {
  // Reload so persisted API data, rather than cached form state, is verified.
  await page.reload();
  await page.getByRole("textbox", { name: "Search by name" }).fill(name);
  await locationRow(page, name)
    .getByRole("button", { name: "Edit Location" })
    .click();
}

async function selectInventoryUsage(page: Page, usage: string) {
  await page
    .getByRole("combobox", { name: "Inventory Usage", exact: true })
    .click();
  await page.getByRole("option", { name: usage, exact: true }).click();
}

async function saveLocation(page: Page, action: "Create" | "Update") {
  await page.getByRole("button", { name: action, exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}

test.describe("Facility Location Inventory Usage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/facility/${getFacilityId()}/settings/locations`);
  });

  test("persists inventory usage, preserves it on other edits, and resets it to none", async ({
    page,
  }) => {
    const name = `Inventory ${faker.string.alphanumeric(8)}`;
    const description = faker.lorem.sentence();
    const inventoryUsage = page.getByRole("combobox", {
      name: "Inventory Usage",
      exact: true,
    });

    await test.step("Create a store location", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await expect(inventoryUsage).toContainText("None");
      await page.getByRole("textbox", { name: /^Name\b/ }).fill(name);
      await selectInventoryUsage(page, "Store");
      await saveLocation(page, "Create");
    });

    await test.step("Reload and change only the description", async () => {
      await reopenLocation(page, name);
      await expect(inventoryUsage).toContainText("Store");
      await page
        .getByRole("textbox", { name: "Description", exact: true })
        .fill(description);
      await saveLocation(page, "Update");
      await reopenLocation(page, name);
      await expect(inventoryUsage).toContainText("Store");
      await expect(
        page.getByRole("textbox", { name: "Description", exact: true }),
      ).toHaveValue(description);
    });

    await test.step("Reset inventory usage and verify it after reloading", async () => {
      await selectInventoryUsage(page, "None");
      await saveLocation(page, "Update");
      await reopenLocation(page, name);
      await expect(inventoryUsage).toContainText("None");
    });
  });

  test("applies inventory usage to every bed created in bulk", async ({
    page,
  }) => {
    const parentName = `Inventory parent ${faker.string.alphanumeric(8)}`;
    const bedName = `Inventory bed ${faker.string.alphanumeric(8)}`;

    await test.step("Create a parent with the default inventory usage", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("textbox", { name: /^Name\b/ }).fill(parentName);
      await saveLocation(page, "Create");
      await reopenLocation(page, parentName);
      await expect(
        page.getByRole("combobox", { name: "Inventory Usage", exact: true }),
      ).toContainText("None");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await locationRow(page, parentName).click();
    });

    await test.step("Create two beds for consumption", async () => {
      await page.getByRole("button", { name: "Add Location" }).click();
      await page.getByRole("combobox", { name: "Location Form" }).click();
      await page.getByRole("option", { name: "Bed", exact: true }).click();
      await page.getByRole("textbox", { name: /^Name\b/ }).fill(bedName);
      await page
        .getByRole("checkbox", { name: "Create Multiple Beds" })
        .check();
      await page.getByRole("combobox", { name: "Number of beds" }).click();
      await page.getByRole("option", { name: "2 Beds", exact: true }).click();
      await selectInventoryUsage(page, "Consumption");
      await saveLocation(page, "Create");
    });

    await test.step("Reload and verify the saved usage on each bed", async () => {
      for (const index of [1, 2]) {
        await reopenLocation(page, `${bedName} ${index}`);
        await expect(
          page.getByRole("combobox", { name: "Inventory Usage", exact: true }),
        ).toContainText("Consumption");
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).not.toBeVisible();
      }
    });
  });
});
