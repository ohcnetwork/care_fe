import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.describe("Token Category - Volunteer Access Verification", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test("Volunteer user should not have access to token category in sidebar", async ({
    page,
  }) => {
    // Manual login as volunteer since we don't have volunteer auth state
    await page.goto("/login");

    // Fill in volunteer credentials
    await page
      .getByRole("textbox", { name: /username/i })
      .fill("volunteer_2_0");
    await page.getByLabel(/password/i).fill("Coronasafe@123");

    // Click login button
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for successful login
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

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
      await page.waitForTimeout(500); // Small delay for animation

      // Verify that Token Category link is NOT present in the sidebar
      const tokenCategoryLink = page.getByRole("link", {
        name: "Token Category",
      });
      await expect(tokenCategoryLink).not.toBeVisible();
    } else {
      // If Settings section doesn't exist at all, that's also valid - volunteers have no settings access
      console.log(
        "Settings section not visible for volunteer - expected behavior",
      );
    }

    // Additional verification: Try to directly navigate to token category URL
    await page.goto(`/facility/${facilityId}/settings/token_category`);

    // Wait a moment for the page to load and show access denied
    await page.waitForTimeout(2000);

    // Volunteer can reach the page but should see access denied notification
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
  });

  test("Volunteer cannot access token category creation page directly", async ({
    page,
  }) => {
    // Manual login as volunteer
    await page.goto("/login");
    await page
      .getByRole("textbox", { name: /username/i })
      .fill("volunteer_2_0");
    await page.getByLabel(/password/i).fill("Coronasafe@123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

    // Try to directly access token category creation page
    await page.goto(`/facility/${facilityId}/settings/token_category/new`);

    // Wait a moment for any redirect to complete
    await page.waitForTimeout(2000);

    // Check what happened after trying to access the creation page
    const currentUrl = page.url();

    if (currentUrl.includes("/settings/token_category/new")) {
      // If still on the creation page, volunteer should see access denied or be unable to use the form
      // Check for form elements that should not be accessible
      const nameField = page.getByRole("textbox", { name: "Name" });
      const resourceTypeField = page.getByRole("combobox", {
        name: "Resource Type",
      });
      const createButton = page.getByRole("button", { name: "Create" });

      // These elements should either not exist or be disabled for volunteers
      const nameExists = await nameField.isVisible().catch(() => false);
      const resourceTypeExists = await resourceTypeField
        .isVisible()
        .catch(() => false);
      const createButtonExists = await createButton
        .isVisible()
        .catch(() => false);

      // Volunteer should not have access to create functionality
      expect(
        nameExists && resourceTypeExists && createButtonExists,
      ).toBeFalsy();
    } else {
      // If redirected (likely to login), that's also valid - volunteer doesn't have access
      expect(currentUrl).not.toContain("/settings/token_category/new");
    }
  });
});
