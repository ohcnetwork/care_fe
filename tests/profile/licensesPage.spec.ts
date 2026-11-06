import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Open Source Licenses page (/licenses)
 * Verifies SBOM tab switching, loading, and package list rendering.
 */
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Licenses Page", () => {
  test("should render and switch between frontend/backend SBOM tabs", async ({ page }) => {
    await page.goto("/licenses");
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

  test("should show loading state and then list packages", async ({ page }) => {
    await page.goto("/licenses");
    // Loading spinner visible
    await expect(page.getByTestId("loading-spinner")).toBeVisible();
    // Wait for at least one package card to appear
    await expect(page.getByRole("link").first()).toBeVisible({ timeout: 10000 });
    // Copy JSON button visible
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();
  });

  test("should copy SBOM JSON to clipboard", async ({ page }) => {
    await page.goto("/licenses");
    // Wait for copy button
    const copyBtn = page.getByRole("button", { name: /copy/i });
    await expect(copyBtn).toBeVisible();
    // Click copy and check for notification
    await copyBtn.click();
    // Notification region should show success
    await expect(page.getByRole("region", { name: /notifications/i })).toContainText(/copied/i);
  });
});
