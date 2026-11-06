import { expect, test } from "@playwright/test";

/**
 * LandingPage E2E tests
 * Covers: organization search, facility search, login buttons, and error state
 */
test.describe("LandingPage", () => {
  test("should display staff and patient login buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /staff login/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /patient login/i })).toBeVisible();
  });

  test("should filter organizations in search", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByRole("textbox").first();
    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.fill("a"); // Type a letter to filter
    // Wait for dropdown to appear
    const dropdown = page.locator("[data-search-container] .absolute");
    await expect(dropdown).toBeVisible();
  });

  test("should disable search button when no organization selected", async ({ page }) => {
    await page.goto("/");
    const searchButton = page.getByRole("button", { name: /search facilities/i });
    await expect(searchButton).toBeDisabled();
  });

  test("should show error message if no organizations match", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByRole("textbox").first();
    await searchInput.click();
    await searchInput.fill("zzzzzzzzzz"); // unlikely to match
    await expect(page.getByText(/no results/i)).toBeVisible();
  });
});
