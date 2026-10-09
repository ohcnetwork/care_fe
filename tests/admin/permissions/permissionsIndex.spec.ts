import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Permissions Index page (/admin/rbac/permissions)
 * Verifies permissions matrix renders, roles are listed, and permission indicators are correct.
 */
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Permissions Index", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/rbac/permissions");
  });

  test("should render permissions matrix table with roles as columns", async ({ page }) => {
    // Table header: first cell is 'Permission', rest are role names
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    const permissionHeader = page.getByRole("columnheader", { name: /permission/i });
    await expect(permissionHeader).toBeVisible();
    // At least one role column should be present
    const roleHeaders = await page.getByRole("columnheader").all();
    expect(roleHeaders.length).toBeGreaterThan(1);
  });

  test("should show permission indicators for each role", async ({ page }) => {
    // Find at least one permission row
    const permissionRows = await page.getByRole("row").all();
    // There should be more than just the header row
    expect(permissionRows.length).toBeGreaterThan(1);
    // Check for at least one green (granted) and one red (not granted) icon
    const granted = page.locator("svg.text-green-500");
    const denied = page.locator("svg.text-red-500");
    await expect(granted.first()).toBeVisible();
    await expect(denied.first()).toBeVisible();
  });

  test("should paginate roles if more than one page", async ({ page }) => {
    // If pagination is present, next/prev buttons should work
    const nextButton = page.getByRole("button", { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      // Table should still be visible after pagination
      await expect(page.getByRole("table")).toBeVisible();
    }
  });
});
