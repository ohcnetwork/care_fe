import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Landing Page (src/pages/Landing/LandingPage.tsx)
 * - Verifies facility search UI, login buttons, and navigation
 */
test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display facility search input and search button", async ({ page }) => {
    await expect(page.getByPlaceholder(/facility|organization/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /search facilities/i })).toBeVisible();
  });

  test("should show staff and patient login buttons when not logged in", async ({ page }) => {
    await expect(page.getByRole("button", { name: /staff login/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /patient login/i })).toBeVisible();
  });

  test("should open staff login page on staff login button click", async ({ page }) => {
    await page.getByRole("button", { name: /staff login/i }).click();
    await expect(page).toHaveURL(/\/login\?mode=staff/);
  });

  test("should open patient login page on patient login button click", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /patient login/i }).click();
    await expect(page).toHaveURL(/\/login\?mode=patient/);
  });
});
