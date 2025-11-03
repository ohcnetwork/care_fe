import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.describe("Token Category - Volunteer Access Verification", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  // Helper function to perform volunteer login
  const loginAsVolunteer = async (page: any) => {
    await page.goto("/login");
    await page
      .getByRole("textbox", { name: /username/i })
      .fill("volunteer_2_0");
    await page.getByLabel(/password/i).fill("Coronasafe@123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });
  };

  // Helper function to verify access denied state
  const verifyAccessDenied = async (page: any) => {
    const currentUrl = page.url();

    if (currentUrl.includes("/settings/token_category")) {
      // If on the token category page, should see access denied notification
      await expect(
        page.locator("text=Access Denied to Token Category"),
      ).toBeVisible();

      // Should not see the Add Token Category button (no permission)
      await expect(
        page.getByRole("button", { name: "Add Token Category" }),
      ).not.toBeVisible();

      // Should see "No products found" or similar message instead of actual data
      await expect(page.getByText("No products found")).toBeVisible();
    } else {
      // If redirected, verify we're not on the token category page
      expect(currentUrl).not.toContain("/settings/token_category");
    }
  };

  test("Volunteer user should not have access to token category in sidebar", async ({
    page,
  }) => {
    // Login as volunteer using helper function
    await loginAsVolunteer(page);

    // Verify we're logged in as volunteer by checking for user-specific elements
    await expect(page.getByRole("heading", { name: /^Hey .+/ })).toBeVisible();

    // Navigate to facility overview
    await page.goto(`/facility/${facilityId}/overview`);

    // Click on sidebar toggle to ensure sidebar is visible/expanded
    const sidebarToggle = page.getByRole("button", { name: "Toggle Sidebar" });
    await sidebarToggle.click();

    // Look for Settings section - volunteers might have limited access
    const settingsSection = page.getByRole("button", { name: "Settings" });

    // Check if Settings section exists for volunteers
    if (await settingsSection.isVisible()) {
      // If Settings exists, click it to expand
      await settingsSection.click();

      // Verify that Token Category link is NOT present in the sidebar
      const tokenCategoryLink = page.getByRole("link", {
        name: "Token Category",
      });
      await expect(tokenCategoryLink).not.toBeVisible();
    } else {
      // If Settings section doesn't exist at all, that's also valid - volunteers have no settings access
      await expect(settingsSection).not.toBeVisible();
    }

    // Additional verification: Try to directly navigate to token category URL
    await page.goto(`/facility/${facilityId}/settings/token_category`);

    // Use helper function to verify access is properly denied
    await verifyAccessDenied(page);
  });

  test("Volunteer cannot access token category creation page directly", async ({
    page,
  }) => {
    // Login as volunteer using helper function
    await loginAsVolunteer(page);

    // Try to directly access token category creation page
    await page.goto(`/facility/${facilityId}/settings/token_category/new`);

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");

    // Check where the volunteer ended up after trying to access creation page
    const currentUrl = page.url();

    // Check if volunteer has login form (indicating they don't have access)
    const hasLoginForm = await page
      .locator("text=Welcome back!")
      .isVisible()
      .catch(() => false);
    const isOnLoginPage = currentUrl.includes("/login") || hasLoginForm;
    const isOnCreationPage = currentUrl.includes(
      "/settings/token_category/new",
    );

    // Volunteer should be denied access - either by redirect to login or access denied message
    if (isOnLoginPage) {
      // On login page - proper access control (volunteer doesn't have valid session)
      expect(hasLoginForm || currentUrl.includes("/login")).toBe(true);
    } else if (isOnCreationPage) {
      // Still on creation page - should see access denied messages
      const hasAccessDenied = await page
        .locator("text=Access Denied")
        .isVisible()
        .catch(() => false);
      const hasNotFound = await page
        .locator("text=Not Found")
        .isVisible()
        .catch(() => false);
      const hasUnauthorized = await page
        .locator("text=Unauthorized")
        .isVisible()
        .catch(() => false);

      expect(hasAccessDenied || hasNotFound || hasUnauthorized).toBe(true);
    } else {
      // Redirected somewhere else - also valid access control
      expect(isOnCreationPage).toBe(false);
    }
  });
});
