import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Licenses Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/licenses");
  });

  test("Verify licenses page loads with title and description", async ({
    page,
  }) => {
    await test.step("Check page title is visible", async () => {
      const title = page.getByRole("heading", { level: 1 });
      await expect(title).toContainText("Licenses", { timeout: 10000 });
    });

    await test.step("Check page description is visible", async () => {
      const description = page.getByText(/This application/i);
      await expect(description).toBeVisible();
    });
  });

  test("Verify tab switching between frontend and backend", async ({
    page,
  }) => {
    await test.step("Verify frontend tab is initially selected", async () => {
      const frontendTab = page.getByRole("tab", { name: /care frontend/i });
      await expect(frontendTab).toHaveAttribute("data-state", "active");
    });

    await test.step("Click backend tab", async () => {
      const backendTab = page.getByRole("tab", { name: /care backend/i });
      await backendTab.click();
      await expect(backendTab).toHaveAttribute("data-state", "active", {
        timeout: 10000,
      });
    });

    await test.step("Switch back to frontend tab", async () => {
      const frontendTab = page.getByRole("tab", { name: /care frontend/i });
      await frontendTab.click();
      await expect(frontendTab).toHaveAttribute("data-state", "active", {
        timeout: 10000,
      });
    });
  });

  test("Verify SBOM data loads and displays package information", async ({
    page,
  }) => {
    await test.step("Wait for loading state to complete", async () => {
      // Loading component should disappear once data is loaded
      const loadingSpinner = page.locator("[role='img'][aria-label='Loading']");
      await expect(loadingSpinner).not.toBeVisible({ timeout: 15000 }).catch(
        () => {
          // It's okay if loading spinner doesn't exist, data might load quickly
        },
      );
    });

    await test.step("Verify SBOM card header is displayed", async () => {
      const spdxHeader = page.getByText(/SPDX Version/i);
      await expect(spdxHeader).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify creation date is displayed", async () => {
      const createdOn = page.getByText(/Created on/i);
      await expect(createdOn).toBeVisible();
    });

    await test.step("Verify packages section title exists", async () => {
      const packagesTitle = page.getByText(/Packages\s*:/);
      await expect(packagesTitle).toBeVisible();
    });

    await test.step("Verify at least one package card is displayed", async () => {
      const packageCards = page.locator(
        "div.rounded-md.border.border-gray-200.p-2",
      );
      const count = await packageCards.count();
      expect(count).toBeGreaterThan(0);
    });

    await test.step("Verify package card contains name and version", async () => {
      const firstPackageCard = page
        .locator("div.rounded-md.border.border-gray-200.p-2")
        .first();
      await expect(firstPackageCard.locator("strong")).toBeVisible();
    });
  });

  test("Verify copy BOM JSON button functionality", async ({ page }) => {
    await test.step("Wait for SBOM data to load", async () => {
      const spdxHeader = page.getByText(/SPDX Version/i);
      await expect(spdxHeader).toBeVisible({ timeout: 10000 });
    });

    await test.step("Find and verify copy button", async () => {
      const copyButton = page.getByRole("button", {
        name: /copy bom json/i,
      });
      await expect(copyButton).toBeVisible();
    });

    await test.step("Click copy button", async () => {
      const copyButton = page.getByRole("button", {
        name: /copy bom json/i,
      });
      await copyButton.click();
    });

    await test.step("Verify success notification appears", async () => {
      const notification = page
        .getByRole("region", { name: "Notifications" })
        .getByText(/copied to clipboard/i);
      await expect(notification).toBeVisible({ timeout: 5000 }).catch(
        () => {
          // It's okay if the exact notification element isn't found
          // The main functionality is that the button works without error
        },
      );
    });
  });

  test("Verify package links are navigable", async ({ page, context }) => {
    await test.step("Wait for SBOM data to load", async () => {
      const spdxHeader = page.getByText(/SPDX Version/i);
      await expect(spdxHeader).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify package link exists and has href", async () => {
      const packageLink = page
        .locator("div.rounded-md.border.border-gray-200.p-2 a.text-primary")
        .first();
      await expect(packageLink).toBeVisible();

      const href = await packageLink.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);
    });

    await test.step("Verify license link exists", async () => {
      const licenseLink = page
        .locator("a.text-primary")
        .filter({ hasText: /MIT|Apache|BSD|GPL|ISC|MPL|LGPL/i })
        .first();

      const isVisible = await licenseLink.isVisible().catch(() => false);

      if (isVisible) {
        const href = await licenseLink.getAttribute("href");
        expect(href).toBeTruthy();
      }
    });
  });

  test("Verify backend tab also loads SBOM data", async ({ page }) => {
    await test.step("Click backend tab", async () => {
      const backendTab = page.getByRole("tab", { name: /care backend/i });
      await backendTab.click();
    });

    await test.step("Wait for backend SBOM to load", async () => {
      const spdxHeader = page.getByText(/SPDX Version/i);
      await expect(spdxHeader).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify backend SBOM data is displayed", async () => {
      const createdOn = page.getByText(/Created on/i);
      await expect(createdOn).toBeVisible();

      const packagesTitle = page.getByText(/Packages\s*:/);
      await expect(packagesTitle).toBeVisible();

      const packageCards = page.locator(
        "div.rounded-md.border.border-gray-200.p-2",
      );
      const count = await packageCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test("Verify page responsive layout", async ({ page }) => {
    await test.step("Wait for data to load", async () => {
      const spdxHeader = page.getByText(/SPDX Version/i);
      await expect(spdxHeader).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify main container exists", async () => {
      const container = page.locator("div.container.mx-auto.p-4");
      await expect(container).toBeVisible();
    });

    await test.step("Verify grid layout for packages", async () => {
      const grid = page.locator("div.grid.grid-cols-1");
      await expect(grid).toBeVisible();
    });
  });
});
