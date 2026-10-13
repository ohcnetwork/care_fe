import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Licenses page (/licenses)
 * Verifies SBOM tab switching, package rendering, and copy-to-clipboard.
 */
test.describe("Licenses Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/licenses");
  });

  test("should render page title and description", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /licenses/i })).toBeVisible();
    await expect(page.getByText(/open source/i)).toBeVisible();
  });

  test("should switch between frontend and backend tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /frontend/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /backend/i })).toBeVisible();
    await page.getByRole("tab", { name: /backend/i }).click();
    await expect(page.getByRole("tab", { name: /backend/i, selected: true })).toBeVisible();
    await page.getByRole("tab", { name: /frontend/i }).click();
    await expect(page.getByRole("tab", { name: /frontend/i, selected: true })).toBeVisible();
  });

  test("should render at least one package card", async ({ page }) => {
    // Wait for loading to finish
    await expect(page.getByRole("progressbar").or(page.getByText(/loading/i))).not.toBeVisible({ timeout: 10000 });
    // At least one package card should be present
    const cards = await page.locator("[class*=rounded-md][class*=border]").first();
    await expect(cards).toBeVisible();
  });

  test("should copy SBOM JSON to clipboard", async ({ page }) => {
    // Wait for loading to finish
    await expect(page.getByRole("progressbar").or(page.getByText(/loading/i))).not.toBeVisible({ timeout: 10000 });
    // Click copy button
    await page.getByRole("button", { name: /copy/i }).click();
    // Clipboard check is not possible in headless, but toast should appear
    await expect(page.getByText(/copied/i)).toBeVisible();
  });
});
