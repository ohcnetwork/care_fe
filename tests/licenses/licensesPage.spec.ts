import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Licenses page (/licenses)
 * - Verifies tab switching, SBOM loading, and copy-to-clipboard
 */
test.describe("Licenses Page", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("should render and show frontend SBOM by default", async ({ page }) => {
    await page.goto("/licenses");
    await expect(page.getByRole("heading", { name: /licenses/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /frontend/i })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(/spdx/i)).toBeVisible();
    await expect(page.getByText(/created on/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();
  });

  test("should switch to backend SBOM tab and load data", async ({ page }) => {
    await page.goto("/licenses");
    await page.getByRole("tab", { name: /backend/i }).click();
    await expect(page.getByRole("tab", { name: /backend/i })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(/spdx/i)).toBeVisible();
    await expect(page.getByText(/created on/i)).toBeVisible();
  });

  test("should copy SBOM JSON to clipboard", async ({ page }) => {
    await page.goto("/licenses");
    const copyButton = page.getByRole("button", { name: /copy/i });
    await copyButton.click();
    // Clipboard API is not available in headless mode, so just check for toast
    await expect(page.getByText(/copied/i)).toBeVisible();
  });
});
