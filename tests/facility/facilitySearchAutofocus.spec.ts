import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Search Autofocus", () => {
  const desktopViewport = { width: 1280, height: 720 };
  const mobileViewport = { width: 375, height: 667 };

  test.describe("Desktop behavior", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(desktopViewport);
    });

    test("1. Desktop: the facility search input receives focus on the first page (/facilities)", async ({
      page,
    }) => {
      await page.goto("/facilities");
      const searchInput = page.locator("#facility-search");
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeFocused();
    });

    test("2. Desktop: the facility search input receives focus on the second page (/organization/:id/facilities)", async ({
      page,
    }) => {
      await page.goto("/");
      await page.getByRole("tab", { name: "Governance" }).click();
      const orgLink = page
        .getByRole("link")
        .filter({ hasText: /Government/i })
        .first();
      await orgLink.click();
      await page.waitForURL(/\/organization\/([^/]+)/);

      await page.getByRole("menuitem", { name: "Facilities" }).click();
      await page.waitForURL(/\/organization\/([^/]+)\/facilities/);

      const searchInput = page.getByPlaceholder(/search by facility name/i);
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeFocused();
    });

    test("4. Desktop: the input remains usable after autofocus (typing immediately)", async ({
      page,
    }) => {
      await page.goto("/facilities");
      const searchInput = page.locator("#facility-search");
      await expect(searchInput).toBeFocused();

      // Type directly using keyboard without clicking
      await page.keyboard.type("Test Facility");
      await expect(searchInput).toHaveValue("Test Facility");
    });

    test("5. Desktop: typing into the input continues to work normally", async ({
      page,
    }) => {
      await page.goto("/facilities");
      const searchInput = page.locator("#facility-search");
      await expect(searchInput).toBeFocused();

      await searchInput.fill("Apollo Hospital");
      await expect(searchInput).toHaveValue("Apollo Hospital");
    });

    test("6. Desktop: component re-renders do not cause unexpected focus changes", async ({
      page,
    }) => {
      await page.goto("/facilities");
      const searchInput = page.locator("#facility-search");
      await expect(searchInput).toBeFocused();

      // Blur the input by clicking elsewhere or calling blur
      await searchInput.blur();
      await expect(searchInput).not.toBeFocused();

      // Trigger an action / wait to ensure focus isn't stolen back unexpectedly
      await page.waitForTimeout(500);
      await expect(searchInput).not.toBeFocused();
    });

    test("7. Desktop: conditional rendering does not cause focus errors", async ({
      page,
    }) => {
      // Navigate to organization layout where facilities tab is mounted conditionally
      await page.goto("/");
      await page.getByRole("tab", { name: "Governance" }).click();
      const orgLink = page
        .getByRole("link")
        .filter({ hasText: /Government/i })
        .first();
      await orgLink.click();
      await page.waitForURL(/\/organization\/([^/]+)/);

      // Switching between tabs conditionally renders content
      await page.getByRole("menuitem", { name: "Users" }).click();
      await page.waitForURL(/\/organization\/([^/]+)\/users/);

      await page.getByRole("menuitem", { name: "Facilities" }).click();
      await page.waitForURL(/\/organization\/([^/]+)\/facilities/);

      const searchInput = page.getByPlaceholder(/search by facility name/i);
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeFocused();
    });

    test("8. Desktop: existing facility search behavior is not broken", async ({
      page,
    }) => {
      await page.goto("/facilities");
      const searchInput = page.locator("#facility-search");
      await expect(searchInput).toBeVisible();

      // Search for non-existent facility
      await searchInput.fill("non_existent_facility_xyz_123");
      await expect(searchInput).toHaveValue("non_existent_facility_xyz_123");

      // Clear input
      await searchInput.clear();
      await expect(searchInput).toHaveValue("");
    });
  });

  test.describe("Mobile behavior", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(mobileViewport);
    });

    test("3. Mobile: autofocus does not occur on /facilities", async ({
      page,
    }) => {
      await page.goto("/facilities");
      const searchInput = page.locator("#facility-search");
      await expect(searchInput).toBeVisible();
      await expect(searchInput).not.toBeFocused();
    });

    test("3. Mobile: autofocus does not occur on /organization/:id/facilities", async ({
      page,
    }) => {
      await page.goto("/");
      await page.getByRole("tab", { name: "Governance" }).click();
      const orgLink = page
        .getByRole("link")
        .filter({ hasText: /Government/i })
        .first();
      await orgLink.click();
      await page.waitForURL(/\/organization\/([^/]+)/);

      await page.getByRole("menuitem", { name: "Facilities" }).click();
      await page.waitForURL(/\/organization\/([^/]+)\/facilities/);

      const searchInput = page.getByPlaceholder(/search by facility name/i);
      await expect(searchInput).toBeVisible();
      await expect(searchInput).not.toBeFocused();
    });
  });
});
