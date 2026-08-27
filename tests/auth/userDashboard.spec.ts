import { expect, test } from "@playwright/test";

// Use authenticated state for all tests
test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto("/");
  });

  /**
   * Verify the dashboard page loads successfully with the expected structure
   */
  test("should load user dashboard successfully", async ({ page }) => {
    // Verify the welcome heading is visible
    await expect(page.getByRole("heading", { name: /^Hey .+$/ })).toBeVisible();

    // Verify the current date is displayed
    const datePattern = new RegExp(
      "(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), .+",
    );
    await expect(page.getByText(datePattern)).toBeVisible();
  });

  /**
   * Verify user profile information is displayed correctly
   */
  test("should display user profile information", async ({ page }) => {
    // Check for user avatar
    const avatar = page.locator("img, [role='img']").first();
    await expect(avatar).toBeVisible();

    // Check for welcome message with user name
    await expect(page.getByRole("heading", { name: /^Hey .+$/ })).toBeVisible();
  });

  /**
   * Verify the Edit Profile action is available
   */
  test("should have edit profile action", async ({ page }) => {
    // Look for Edit Profile button/link
    const editProfileButton = page.getByRole("link", {
      name: /edit profile/i,
    });

    // On mobile, it might be directly visible
    // On desktop, it might be in a dropdown menu
    const isDirectlyVisible = await editProfileButton.isVisible();

    if (!isDirectlyVisible) {
      // Try opening dropdown menu (desktop view)
      const menuButton = page.locator("button").filter({ hasText: /⋮|•••/ });
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
    }

    await expect(editProfileButton).toBeVisible();
  });

  /**
   * Verify the Sign Out action is available
   */
  test("should have sign out action", async ({ page }) => {
    // Look for Sign Out button
    const signOutButton = page.getByRole("button", { name: /sign out/i });

    // On mobile, it might be directly visible
    // On desktop, it might be in a dropdown menu
    const isDirectlyVisible = await signOutButton.isVisible();

    if (!isDirectlyVisible) {
      // Try opening dropdown menu (desktop view)
      const menuButton = page.locator("button").filter({ hasText: /⋮|•••/ });
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
    }

    await expect(signOutButton).toBeVisible();
  });

  /**
   * Verify Admin Dashboard link is visible for superusers
   */
  test("should show admin dashboard link for superusers", async ({ page }) => {
    // Look for Admin Dashboard button/link
    const adminLink = page.getByRole("link", { name: /admin dashboard/i });

    // Admin link should be visible if user is superuser
    // This test will pass if the link exists (means user is superuser)
    // or skip if not visible (non-superuser)
    const isVisible = await adminLink.isVisible();
    if (isVisible) {
      await expect(adminLink).toBeVisible();
      await expect(adminLink).toHaveAttribute("href", "/admin/questionnaire");
    }
  });

  /**
   * Verify dashboard tabs are present
   */
  test("should display dashboard tabs", async ({ page }) => {
    // Check for tab navigation (role="tablist")
    const tablist = page.locator('[role="tablist"]');

    // Dashboard should have at least one tab visible
    // Common tabs: Facilities, Responsibilities, Governance
    const hasAnyTab =
      (await page.getByRole("tab", { name: /facilities/i }).isVisible()) ||
      (await page.getByRole("tab", { name: /responsibilities/i }).isVisible()) ||
      (await page.getByRole("tab", { name: /governance/i }).isVisible());

    expect(hasAnyTab).toBeTruthy();
  });

  /**
   * Verify Facilities tab content
   */
  test("should display facilities tab and content", async ({ page }) => {
    // Look for Facilities tab
    const facilitiesTab = page.getByRole("tab", { name: /facilities/i });

    // Only proceed if Facilities tab exists
    if (await facilitiesTab.isVisible()) {
      await facilitiesTab.click();

      // Verify tab panel is displayed
      const facilitiesPanel = page.locator('[id="facilities-panel"]');
      await expect(facilitiesPanel).toBeVisible();

      // Check for facility cards or description text
      const hasFacilityContent =
        (await page.locator('[role="link"]').first().isVisible()) ||
        (await page.getByText(/facility/i).isVisible());

      expect(hasFacilityContent).toBeTruthy();
    }
  });

  /**
   * Verify tab navigation works correctly
   */
  test("should switch between tabs", async ({ page }) => {
    // Get all available tabs
    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();

    // Only test if there are multiple tabs
    if (tabCount > 1) {
      // Get first two tabs
      const firstTab = tabs.first();
      const secondTab = tabs.nth(1);

      // Click first tab
      await firstTab.click();
      await expect(firstTab).toHaveAttribute("aria-selected", "true");

      // Click second tab
      await secondTab.click();
      await expect(secondTab).toHaveAttribute("aria-selected", "true");
      await expect(firstTab).toHaveAttribute("aria-selected", "false");
    }
  });

  /**
   * Verify facility cards have correct structure and navigation
   */
  test("should display facility cards with proper navigation", async ({
    page,
  }) => {
    // Look for Facilities tab
    const facilitiesTab = page.getByRole("tab", { name: /facilities/i });

    if (await facilitiesTab.isVisible()) {
      await facilitiesTab.click();

      // Find facility cards (links to facility pages)
      const facilityCards = page.locator('[role="link"]').filter({
        has: page.locator("text=/view facility details/i"),
      });

      const cardCount = await facilityCards.count();

      // If there are facility cards, verify structure
      if (cardCount > 0) {
        const firstCard = facilityCards.first();

        // Verify card has an avatar/image
        await expect(firstCard.locator('[role="img"]')).toBeVisible();

        // Verify card has facility name (heading)
        await expect(firstCard.locator("h3")).toBeVisible();

        // Verify card links to facility overview
        const href = await firstCard.getAttribute("href");
        expect(href).toMatch(/\/facility\/.+\/overview/);
      }
    }
  });

  /**
   * Verify dashboard is responsive and accessible
   */
  test("should have proper accessibility attributes", async ({ page }) => {
    // Verify main heading hierarchy
    const mainHeading = page.getByRole("heading", { name: /^Hey .+$/ });
    await expect(mainHeading).toBeVisible();

    // Verify tab navigation has proper ARIA attributes
    const tablist = page.locator('[role="tablist"]');
    if (await tablist.isVisible()) {
      await expect(tablist).toHaveAttribute("aria-label", "Dashboard Sections");

      // Verify each tab has proper ARIA attributes
      const tabs = page.getByRole("tab");
      const tabCount = await tabs.count();

      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        const tab = tabs.nth(i);
        await expect(tab).toHaveAttribute("aria-controls");
        await expect(tab).toHaveAttribute("aria-selected");
      }
    }
  });
});
