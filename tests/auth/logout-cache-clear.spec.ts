import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Reusable helper to sign out via the sidebar user menu.
 * Uses unconditional assertions — fails loudly if elements are missing.
 */
async function signOut(page: Page) {
  // Open the sidebar user dropdown — the trigger is the SidebarMenuButton
  // containing the user's name in the sidebar footer
  const userMenuTrigger = page
    .locator('[data-slot="sidebar"] [data-slot="sidebar-menu-button"]')
    .last();
  await expect(userMenuTrigger).toBeVisible({ timeout: 5_000 });
  await userMenuTrigger.click();

  // Click the "Logout" dropdown menu item
  const logoutItem = page.getByRole("menuitem", { name: /logout/i });
  await expect(logoutItem).toBeVisible();
  await logoutItem.click();
}

test.describe("Logout Cache Clearing", () => {
  test("should fully clear session and redirect to landing page on logout", async ({
    page,
  }) => {
    // Navigate to the app — user should be authenticated
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /^Hey .+$/ })).toBeVisible({
      timeout: 10_000,
    });

    // Sign out using the sidebar menu
    await signOut(page);

    // Should redirect to the landing page
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /log in as staff/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should not show stale user data after logout", async ({
    page,
    context,
  }) => {
    // Navigate to the app while authenticated
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /^Hey .+$/ })).toBeVisible({
      timeout: 10_000,
    });

    // Record the current user's greeting
    const greeting = await page
      .getByRole("heading", { name: /^Hey .+$/ })
      .textContent();

    // Sign out using the sidebar menu
    await signOut(page);

    // Wait for redirect to landing page
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /log in as staff/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Clear cookies and browser storage to simulate fresh session
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to home — should see the public landing page, not cached data
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /log in as staff/i }),
    ).toBeVisible({ timeout: 10_000 });

    // The cached user greeting must not be visible
    if (greeting) {
      await expect(page.getByText(greeting, { exact: true })).toBeHidden();
    }
  });
});
