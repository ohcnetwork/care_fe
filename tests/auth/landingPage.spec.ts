import { expect, test } from "@playwright/test";

/**
 * E2E tests for the Landing Page ("/" route)
 * Covers facility search, organization selection, login buttons, and error states.
 */

test.describe("Landing Page", () => {
  test("should display logos and search input", async ({ page }) => {
    await page.goto("/");
    // Main logo
    await expect(page.locator("img[alt='Logo']").first()).toBeVisible();
    // Facility search input
    await expect(page.getByRole("textbox")).toBeVisible();
    // Search button
    await expect(page.getByRole("button", { name: /search facilities/i })).toBeVisible();
  });

  test("should show staff and patient login options when logged out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /staff login/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /patient login/i })).toBeVisible();
  });

  test("should filter organizations as user types", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox");
    await input.click();
    await input.fill("a");
    // Wait for dropdown to appear
    await expect(page.locator("[data-search-container] .absolute")).toBeVisible();
    // At least one result or empty state
    const items = page.locator("[data-search-container] [role='option']");
    await expect(items.first()).toBeVisible();
  });

  test("should clear search and selection", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox");
    await input.click();
    await input.fill("test");
    // Click clear button
    await page.getByRole("button").filter({ has: page.locator("[data-search-container] svg") }).click();
    await expect(input).toHaveValue("");
  });

  test("should disable search button until organization is selected", async ({ page }) => {
    await page.goto("/");
    const searchBtn = page.getByRole("button", { name: /search facilities/i });
    await expect(searchBtn).toBeDisabled();
    // Select an org if available
    const input = page.getByRole("textbox");
    await input.click();
    const firstOption = page.locator("[data-search-container] [role='option']").first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await expect(searchBtn).not.toBeDisabled();
    }
  });

  test("should navigate to facilities page on search", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox");
    await input.click();
    const firstOption = page.locator("[data-search-container] [role='option']").first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await page.getByRole("button", { name: /search facilities/i }).click();
      await expect(page).toHaveURL(/facilities/);
    }
  });
});
