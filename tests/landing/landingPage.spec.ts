import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Landing Page (src/pages/Landing/LandingPage.tsx)
 * Covers: facility search, login buttons, and organization selection.
 */
test.describe("Landing Page", () => {
  test("should render logos and search input", async ({ page }) => {
    await page.goto("/");
    // Logo(s) should be visible
    await expect(page.locator("img[alt='Logo']").first()).toBeVisible();
    // Facility search input should be visible
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("should show staff and patient login buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /staff login/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /patient login/i })).toBeVisible();
  });

  test("should show organization suggestions when typing in search", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox");
    await input.click();
    await input.fill("a"); // Type a letter to trigger suggestions
    // Wait for dropdown to appear
    await expect(page.locator("[data-search-container] .absolute")).toBeVisible();
  });

  test("should disable search button until organization is selected", async ({ page }) => {
    await page.goto("/");
    const searchButton = page.getByRole("button", { name: /search facilities/i });
    await expect(searchButton).toBeDisabled();
  });
});
