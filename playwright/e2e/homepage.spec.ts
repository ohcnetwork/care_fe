import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Verify the page has loaded by checking for common elements
    await expect(page).toHaveTitle(/CARE/);
  });

  test("should have a login link", async ({ page }) => {
    await page.goto("/");

    // Check for login navigation
    const loginLink = page.locator('a[href*="/login"]');
    await expect(loginLink).toBeVisible();
  });
});
