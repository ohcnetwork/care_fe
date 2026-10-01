import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Licenses page (/licenses)
 * - Verifies tab switching, SBOM loading, and package/license rendering.
 */
test.describe("Licenses Page", () => {
  test.use({ storageState: "../.auth/user.json" });

  test("should render the licenses page and show tabs", async ({ page }) => {
    await page.goto("/licenses");
    await expect(page.getByRole("heading", { name: /licenses/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /frontend/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /backend/i })).toBeVisible();
  });

  test("should switch tabs and load SBOM data", async ({ page }) => {
    await page.goto("/licenses");
    // Wait for frontend SBOM to load
    await expect(page.getByText(/spdx/i)).toBeVisible();
    await page.getByRole("tab", { name: /backend/i }).click();
    await expect(page.getByText(/spdx/i)).toBeVisible();
  });

  test("should render at least one package with license link", async ({ page }) => {
    await page.goto("/licenses");
    // Wait for SBOM to load
    await expect(page.getByText(/spdx/i)).toBeVisible();
    // At least one package name should be visible
    const pkg = page.locator("[class*=text-lg]", { hasText: /.+/ });
    await expect(pkg.first()).toBeVisible();
    // License link should be present
    const licenseLink = page.locator("a", { hasText: /.+/ }).filter({ hasText: /mit|apache|gpl|bsd|lgpl|mpl|unlicense|cc0/i });
    await expect(licenseLink.first()).toBeVisible();
  });
});
