import { expect, test } from "@playwright/test";

test.describe("Token Category List - Permission Tests", () => {
  test.describe("Admin Access", () => {
    // Use admin authenticated state
    test.use({ storageState: "tests/.auth/user.json" });

    test("Admin can see Token Category in sidebar and list token", async ({
      page,
    }) => {
      // Step 1: Start from the main page
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Step 2: Select the first facility card (look for facility link)
      const firstFacilityCard = page
        .locator('a[href*="/facility/"][href$="/overview"]')
        .first();
      await expect(firstFacilityCard).toBeVisible();
      await firstFacilityCard.click();

      // Wait for navigation to facility page
      await page.waitForURL(/\/facility\/[^/]+/);

      // Step 3: Open toggle sidebar
      const sidebarToggle = page.getByRole("button", {
        name: "Toggle Sidebar",
      });
      await expect(sidebarToggle).toBeVisible();
      await sidebarToggle.click();

      // Step 4: Click on Settings section to expand it
      const settingsSection = page.getByRole("button", { name: "Settings" });
      await expect(settingsSection).toBeVisible();
      await settingsSection.click();

      // Step 5: Check for visibility of Token Category in navbar
      const tokenCategoryLink = page.getByRole("link", {
        name: "Token Category",
      });
      await expect(tokenCategoryLink).toBeVisible();

      // Step 6: Click on Token Category link
      await tokenCategoryLink.click();

      // Verify we're on the token category list page
      await expect(page).toHaveURL(/\/settings\/token_category/);
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible();
    });
  });

  test.describe("Volunteer Access", () => {
    test.beforeEach(async ({ page }) => {
      // Login as volunteer
      await page.goto("/login");
      await page
        .getByRole("textbox", { name: /username/i })
        .fill("volunteer_2_0");
      await page.getByLabel(/password/i).fill("Coronasafe@123");
      await page.getByRole("button", { name: /login/i }).click();
      await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

      // Verify we're logged in as volunteer
      await expect(
        page.getByRole("heading", { name: /^Hey .+/ }),
      ).toBeVisible();
    });

    test("Volunteer cannot see Token Category in sidebar", async ({ page }) => {
      // Step 1: Start from the main page
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Step 2: Select the first facility card (look for facility link)
      const firstFacilityCard = page
        .locator('a[href*="/facility/"][href$="/overview"]')
        .first();
      await expect(firstFacilityCard).toBeVisible();
      await firstFacilityCard.click();

      // Wait for navigation to facility page
      await page.waitForURL(/\/facility\/[^/]+/);

      // Step 3: Open toggle sidebar
      const sidebarToggle = page.getByRole("button", {
        name: "Toggle Sidebar",
      });
      await expect(sidebarToggle).toBeVisible();
      await sidebarToggle.click();

      // Step 4: Check if Settings section exists
      const settingsSection = page.getByRole("button", { name: "Settings" });

      if (await settingsSection.isVisible()) {
        // If Settings exists, click it to expand
        await settingsSection.click();

        // Step 5: Verify Token Category link is NOT visible
        const tokenCategoryLink = page.getByRole("link", {
          name: "Token Category",
        });
        await expect(tokenCategoryLink).not.toBeVisible();
      } else {
        // If Settings section doesn't exist, that's also valid for volunteers
        await expect(settingsSection).not.toBeVisible();
      }
    });
  });
});
