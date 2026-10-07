import { test, expect } from "@playwright/test";

// REQUIRED: Use authenticated storage state
// This test assumes the user has access to the PlugConfig admin pages
// and that the backend is running with the appropriate API endpoints.
test.use({ storageState: "tests/.auth/user.json" });

test.describe("PlugConfig Admin Pages", () => {
  test("should display the PlugConfig list and navigate to create form", async ({ page }) => {
    await page.goto("/admin/apps");
    await expect(page.getByRole("heading", { name: /plug/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add/i })).toBeVisible();
    await page.getByRole("button", { name: /add/i }).click();
    await expect(page).toHaveURL(/\/admin\/apps\/new/);
  });

  test("should show validation error for invalid JSON in meta field", async ({ page }) => {
    await page.goto("/admin/apps/new");
    await page.getByLabel(/slug/i).fill("test-plug");
    await page.getByLabel(/meta/i).fill("not a json");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/invalid json/i)).toBeVisible();
  });
});
