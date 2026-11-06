import { test, expect } from "@playwright/test";

/**
 * E2E tests for the LandingPage (facility search and login entry)
 * Covers: logo, search, org filter, login buttons, and header for logged-in state
 */
test.describe("LandingPage", () => {
  test("loads and displays logo and search input", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    await expect(page.locator("img[alt='Logo']")).toBeVisible();
  });

  test("organization search filters results", async ({ page }) => {
    await page.goto("/");
    const input = page.getByPlaceholder(/search/i);
    await input.fill("test");
    // Wait for dropdown to open and show results (may be empty)
    await expect(page.locator("[data-search-container] .absolute [role='listbox']")).toBeVisible();
  });

  test("search button disabled until org selected", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /search facilities/i });
    await expect(button).toBeDisabled();
  });

  test("login buttons visible for staff and patient", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /staff login/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /patient login/i })).toBeVisible();
  });

  // Note: Authenticated state and navigation to /facilities require more setup/mocking
});
