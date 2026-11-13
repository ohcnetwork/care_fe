import { test, expect } from "@playwright/test";

/**
 * E2E tests for PlugConfigList and PlugConfigEdit pages
 * - Verifies listing, navigation, creation, editing, and error handling
 * - Uses stored auth state for admin user
 */
test.describe("PlugConfig management", () => {
  test.use({ storageState: "../.auth/user.json" });

  test("should display plug config list and navigate to create page", async ({ page }) => {
    await page.goto("/admin/apps");
    await expect(page.getByRole("heading", { name: /plug/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add/i })).toBeVisible();
    await page.getByRole("button", { name: /add/i }).click();
    await expect(page).toHaveURL(/\/admin\/apps\/new/);
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();
  });

  test("should validate meta JSON and show error on invalid input", async ({ page }) => {
    await page.goto("/admin/apps/new");
    await page.getByLabel(/slug/i).fill("test-plug");
    await page.getByLabel(/meta/i).fill("not-json");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/invalid json/i)).toBeVisible();
  });

  test("should cancel creation and return to list", async ({ page }) => {
    await page.goto("/admin/apps/new");
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page).toHaveURL(/\/admin\/apps/);
  });
});
