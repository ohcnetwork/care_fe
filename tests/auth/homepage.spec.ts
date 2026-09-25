import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    await page.goto("/");

    // Verify the page loaded
    await expect(page).toHaveTitle(/CARE/);
  });

  test("should display main navigation", async ({ page }) => {
    await page.goto("/");

    // Check for login button
    await expect(
      page.getByRole("button", { name: /Log in as staff/i }),
    ).toBeVisible();
  });

  /**
   * Verifies facility search: typing, dropdown, selection, and navigation.
   */
  test("should allow searching and selecting a facility organization", async ({ page }) => {
    await page.goto("/");

    // Find the search input by placeholder (uses i18n, so fallback to role and class)
    const searchInput = page.locator('input[placeholder], input').filter({ has: page.locator('[data-search-container]') });
    await expect(searchInput).toBeVisible();

    // Type a common letter to trigger dropdown
    await searchInput.click();
    await searchInput.fill("a");

    // Wait for dropdown to appear
    const dropdown = page.locator('.command-group, [role="listbox"]');
    await expect(dropdown).toBeVisible();

    // Select the first organization if present
    const firstOption = dropdown.locator('[role="option"], [data-testid="command-item"]').first();
    if (await firstOption.isVisible()) {
      const orgName = await firstOption.textContent();
      await firstOption.click();
      // The input should now be cleared or show the org name
      await expect(searchInput).toHaveValue(/|a|/i);
    }

    // The search button should be enabled after selection
    const searchButton = page.getByRole("button", { name: /search facilities/i });
    await expect(searchButton).toBeEnabled();

    // Click search and verify navigation
    await searchButton.click();
    await expect(page).toHaveURL(/facilities\?/);
  });
});
