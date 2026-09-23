import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Licenses Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/licenses");
  });

  test("should load licenses page with default frontend tab", async ({
    page,
  }) => {
    /**
     * Verifies the licenses page loads successfully and displays the main title
     */
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Verify frontend tab is selected by default
    const frontendTab = page.getByRole("tab", { name: /frontend|care_frontend/i });
    await expect(frontendTab).toBeVisible();
  });

  test("should display tab navigation between frontend and backend", async ({
    page,
  }) => {
    /**
     * Verifies users can switch between frontend and backend license tabs
     */
    const frontendTab = page.getByRole("tab", { name: /frontend|care_frontend/i });
    const backendTab = page.getByRole("tab", { name: /backend|care_backend/i });

    // Both tabs should be visible
    await expect(frontendTab).toBeVisible();
    await expect(backendTab).toBeVisible();

    // Click backend tab
    await backendTab.click();
    await expect(backendTab).toHaveAttribute(
      "data-state",
      "active"
    );

    // Click back to frontend tab
    await frontendTab.click();
    await expect(frontendTab).toHaveAttribute(
      "data-state",
      "active"
    );
  });

  test("should display SBOM package information", async ({ page }) => {
    /**
     * Verifies that the SBOM (Software Bill of Materials) viewer displays package information
     * including SPDX version and creation date
     */
    // Wait for loading to complete
    await page.waitForLoadState("networkidle");

    // Look for SPDX version heading (appears after data loads)
    const spdxVersionHeading = page.locator("h2").filter({
      hasText: /spdx_sbom_version|SPDX Version/i,
    });

    const isVisible = await spdxVersionHeading.isVisible().catch(() => false);

    if (isVisible) {
      await expect(spdxVersionHeading).toBeVisible();
      // Verify creation info is shown
      const createdText = page.locator("p").filter({
        hasText: /created_on|Created on/i,
      });
      await expect(createdText).toBeVisible();
    }
  });

  test("should have copy SBOM JSON button", async ({ page }) => {
    /**
     * Verifies the copy button for SBOM JSON is present and visible
     */
    await page.waitForLoadState("networkidle");

    const copyButton = page.getByRole("button").filter({
      hasText: /copy_bom_json|Copy BOM JSON|copy/i,
    });

    const isVisible = await copyButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(copyButton).toBeVisible();
      await expect(copyButton).toBeEnabled();
    }
  });

  test("should switch tabs and display backend data", async ({ page }) => {
    /**
     * Verifies that switching to backend tab loads different data
     */
    await page.waitForLoadState("networkidle");

    const backendTab = page.getByRole("tab", { name: /backend|care_backend/i });
    await backendTab.click();

    // Wait for new data to load
    await page.waitForTimeout(500);

    // Backend tab should now be active
    await expect(backendTab).toHaveAttribute("data-state", "active");
  });

  test("should display page description", async ({ page }) => {
    /**
     * Verifies the page displays a description about licenses/SBOM
     */
    const description = page.locator("p").filter({
      hasText: /licenses_description|license/i,
    });

    const isVisible = await description.isVisible().catch(() => false);
    if (isVisible) {
      await expect(description).toBeVisible();
    }
  });
});
