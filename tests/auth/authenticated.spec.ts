import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Authenticated User Flow", () => {
  test("should access dashboard when logged in", async ({ page }) => {
    // Navigate to a protected page
    await page.goto("/");

    // Verify user is logged in
    // Adjust these selectors based on your actual application
    await expect(page.getByRole("heading", { name: /^Hey .+$/ })).toBeVisible();
  });

  test("should be able to navigate to facilities", async ({ page }) => {
    await page.goto("/");

    // Look for facilities navigation
    // Adjust based on your actual navigation structure
    const facilitiesLink = page.getByRole("link", { name: /facilit/i }).first();
    if (await facilitiesLink.isVisible()) {
      await facilitiesLink.click();
      await expect(page).toHaveURL(/.*facilit/);
    }
  });
});
