import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Licenses page (/licenses)
 * - Verifies SBOM tab switching, loading, and package list rendering
 * - Checks copy-to-clipboard and basic accessibility
 */
test.describe("Licenses Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/licenses");
  });

  test("should render the licenses page and show frontend SBOM by default", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /licenses/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /care frontend/i })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(/spdx/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();
  });

  test("should switch to backend SBOM tab and show data", async ({ page }) => {
    await page.getByRole("tab", { name: /care backend/i }).click();
    await expect(page.getByRole("tab", { name: /care backend/i })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(/spdx/i)).toBeVisible();
  });

  test("should copy SBOM JSON to clipboard", async ({ page }) => {
    // Click copy button
    await page.getByRole("button", { name: /copy/i }).click();
    // Clipboard API is not directly testable in all environments, but toast should appear
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible();
  });

  test("should list at least one package in SBOM", async ({ page }) => {
    // Wait for at least one package link to appear
    await expect(page.locator("a[href^='http']").first()).toBeVisible();
  });
});
