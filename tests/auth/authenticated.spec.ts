import { expect, test } from "@playwright/test";
import { verifyAuthentication } from "../helper/auth";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Authenticated User Flow", () => {
  test("should access dashboard when logged in", async ({ page }) => {
    // Navigate to a protected page
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 10000 });

    // Verify user is logged in
    await expect(page.getByRole("heading", { name: /^Hey .+$/ })).toBeVisible({
      timeout: 10000,
    });
  });

  test("should be able to navigate to facilities", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 10000 });

    // Verify authentication before proceeding
    const isAuthenticated = await verifyAuthentication(page);
    expect(isAuthenticated).toBe(true);

    // Look for facilities navigation
    const facilitiesLink = page.getByRole("link", { name: /facilit/i }).first();
    await facilitiesLink.waitFor({ state: "visible", timeout: 10000 });
    
    if (await facilitiesLink.isVisible()) {
      await facilitiesLink.click();
      await expect(page).toHaveURL(/.*facilit/, { timeout: 10000 });
    }
  });
});
