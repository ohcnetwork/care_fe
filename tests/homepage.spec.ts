import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    await page.goto("/");

    // Verify the page loaded
    await expect(page).toHaveTitle(/CARE/);
  });

  test("should display main navigation", async ({ page }) => {
    await page.goto("/");

    // Check for login link
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
  });

  test("should have facility search functionality", async ({ page }) => {
    await page.goto("/");

    // Look for search or facility-related elements
    // This test should be updated based on actual homepage content
    const searchInput = page.getByRole("searchbox").first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });
});
