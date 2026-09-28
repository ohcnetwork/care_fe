import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    await page.goto("/");

    // Verify the page loaded
    await expect(page).toHaveTitle(/CARE/);
  });
});
