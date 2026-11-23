import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test(
    "should load successfully",
    { tag: ["@atomic", "@cap:nav.landing.view"] },
    async ({ page }) => {
      await page.goto("/");

      // Verify the page loaded
      await expect(page).toHaveTitle(/CARE/);
    },
  );
});
