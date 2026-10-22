import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Licenses page (/licenses)
 * Verifies SBOM tab switching, package rendering, and copy functionality.
 */
test.describe("Licenses Page", () => {
  test.use({ storageState: "../.auth/user.json" });

  test("should render frontend and backend tabs and load SBOM data", async ({ page }) => {
    await page.goto("/licenses");
    await expect(page.getByRole("heading", { name: /licenses/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /frontend/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /backend/i })).toBeVisible();
    // Wait for loading to finish and SBOM content to appear
    await expect(page.getByText(/spdx/i)).toBeVisible();
    await expect(page.getByText(/created on/i)).toBeVisible();
    await expect(page.getByText(/packages/i)).toBeVisible();
  });

  test("should switch tabs and update SBOM data", async ({ page }) => {
    await page.goto("/licenses");
    await page.getByRole("tab", { name: /backend/i }).click();
    await expect(page.getByText(/spdx/i)).toBeVisible();
    await expect(page.getByText(/created on/i)).toBeVisible();
    await expect(page.getByText(/packages/i)).toBeVisible();
    // Switch back to frontend
    await page.getByRole("tab", { name: /frontend/i }).click();
    await expect(page.getByText(/spdx/i)).toBeVisible();
  });

  test("should copy SBOM JSON to clipboard", async ({ page }) => {
    await page.goto("/licenses");
    // Wait for copy button to be visible
    const copyBtn = page.getByRole("button", { name: /copy/i });
    await expect(copyBtn).toBeVisible();
    // Mock clipboard
    await page.evaluate(() => {
      window.navigator.clipboard = {
        writeText: async () => Promise.resolve(),
      } as any;
    });
    await copyBtn.click();
    // Toast should appear
    await expect(page.getByText(/copied/i)).toBeVisible();
  });

  test("should render at least one package card", async ({ page }) => {
    await page.goto("/licenses");
    // Wait for package cards
    await expect(page.locator("[class*=rounded-md][class*=border]").first()).toBeVisible();
  });
});
