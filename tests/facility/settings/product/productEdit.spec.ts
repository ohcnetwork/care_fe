import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Edit", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/product`);
  });

  test("should update product status and revert", async ({ page }) => {
    await page.getByRole("link", { name: "View" }).first().click();

    await page.getByRole("button", { name: "Edit" }).click();

    await page.getByLabel("Status").click();
    await page.getByRole("option", { name: "Inactive" }).click();
    await page.getByRole("button", { name: "Update" }).click();

    await expect(page).toHaveURL(/\/settings\/product\/[0-9a-fA-F-]{36}$/);

    await expect(page.getByText("Back to list")).toBeVisible();

    // Revert status to active as part of cleanup
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Status").click();
    await page.getByRole("option", { name: "Active", exact: true }).click();
    await page.getByRole("button", { name: "Update" }).click();

    await expect(page.getByText("Product updated successfully")).toBeVisible();
  });
});
