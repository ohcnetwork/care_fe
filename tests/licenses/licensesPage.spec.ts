import { expect, test } from "@playwright/test";

/**
 * E2E tests for the Open Source Licenses page (/licenses)
 * Verifies SBOM tab switching, package list rendering, and copy JSON functionality.
 */
test.describe("Licenses Page", () => {
  test("should render and switch between frontend/backend SBOM tabs", async ({ page }) => {
    await page.goto("/licenses");

    // Heading and description
    await expect(page.getByRole("heading", { name: /licenses/i })).toBeVisible();
    await expect(page.getByText(/open source/i)).toBeVisible();

    // Tabs for frontend/backend
    const frontendTab = page.getByRole("tab", { name: /frontend/i });
    const backendTab = page.getByRole("tab", { name: /backend/i });
    await expect(frontendTab).toBeVisible();
    await expect(backendTab).toBeVisible();
    await expect(frontendTab).toHaveAttribute("aria-selected", "true");

    // Switch to backend tab
    await backendTab.click();
    await expect(backendTab).toHaveAttribute("aria-selected", "true");
    await expect(frontendTab).toHaveAttribute("aria-selected", "false");
  });

  test("should display SBOM package list and allow copying JSON", async ({ page }) => {
    await page.goto("/licenses");

    // Wait for SBOM package list to load
    await expect(page.getByText(/spdx/i)).toBeVisible();
    await expect(page.getByText(/packages/i)).toBeVisible();

    // At least one package link should be present
    const pkgLinks = page.locator("a[href^='https://']");
    await expect(pkgLinks.first()).toBeVisible();

    // Copy JSON button
    const copyBtn = page.getByRole("button", { name: /copy/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    // Toast should appear (text may be localized)
    await expect(page.getByText(/copied/i)).toBeVisible();
  });
});
