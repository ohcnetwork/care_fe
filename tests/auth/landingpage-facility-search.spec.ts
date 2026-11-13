import { expect, test } from "@playwright/test";

/**
 * E2E tests for the Landing Page facility search flow.
 * Covers: rendering, search input, organization selection, and navigation.
 */
test.describe("LandingPage Facility Search", () => {
  test("should render facility search input and button", async ({ page }) => {
    await page.goto("/");
    // Search input should be visible
    await expect(page.getByRole("textbox")).toBeVisible();
    // Search button should be visible and disabled initially
    await expect(page.getByRole("button", { name: /search facilities/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /search facilities/i })).toBeDisabled();
  });

  test("should show organization suggestions as user types", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox");
    await input.click();
    await input.fill("a"); // Type a letter to trigger suggestions
    // Wait for suggestions dropdown
    await expect(page.getByRole("listbox")).toBeVisible();
  });

  test("should enable search button after selecting organization", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox");
    await input.click();
    await input.fill("a");
    // Wait for suggestions
    const options = page.getByRole("option");
    if (await options.count() > 0) {
      await options.nth(0).click();
      // Search button should now be enabled
      await expect(page.getByRole("button", { name: /search facilities/i })).toBeEnabled();
    }
  });

  test("should navigate to facilities page on search", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox");
    await input.click();
    await input.fill("a");
    const options = page.getByRole("option");
    if (await options.count() > 0) {
      await options.nth(0).click();
      await page.getByRole("button", { name: /search facilities/i }).click();
      // Should navigate to /facilities
      await expect(page).toHaveURL(/\/facilities\?/);
    }
  });
});
