import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { DELETED_STATUS } from "./specimenDefinitionConstants";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Specimen Definitions Delete", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    const targetUrl = `/facility/${facilityId}/settings/specimen_definitions`;
    await page.goto(targetUrl);
  });

  test("should be able to delete specimen definition", async ({ page }) => {
    const allRows = page.locator('[data-slot="table-body"] tr');
    await allRows.first().waitFor({ state: "visible" }); // Wait for the table to load

    const rowCount = await allRows.count();
    const rowIndex = faker.number.int({ min: 0, max: rowCount - 1 });
    const row = allRows.nth(rowIndex);
    // Click the view link for our specific definition

    const name = await row.getByRole("cell").nth(0).textContent();
    await row.getByRole("link", { name: /view/i }).click();

    // Click Delete button
    await page.getByRole("button", { name: /delete/i }).click();

    // Confirm deletion in the dialog
    await page.getByRole("button", { name: /confirm/i }).click();

    // Wait for table to be loaded
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toBeVisible();

    // Filter by retired status
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: DELETED_STATUS }).click();

    // Wait for filter to apply
    await expect(page).toHaveURL(/status=retired/);

    // Search for the deleted definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(name || "");
    await page.getByRole("link", { name: /view/i }).first().click();

    // Verify the definition exists with retired status
    await expect(page.getByText(name || "")).toBeVisible();
    await expect(page.getByText(DELETED_STATUS)).toBeVisible();
  });
});
