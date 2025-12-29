import { test as base, expect } from "@playwright/test";
import { verifyAuthentication, isOnLoginPage } from "../helper/auth";

/**
 * Extended Playwright test fixture that automatically verifies authentication
 * before each test and provides utilities for handling session expiration.
 */
export const test = base.extend({
  page: async ({ page, context }, use) => {
    // Before test: verify authentication if a storage state is configured
    // We check this by attempting to navigate to the home page
    try {
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 10000 });

      // Check if we got redirected to login page (session expired)
      if (await isOnLoginPage(page)) {
        console.warn(
          "⚠️ Session expired or invalid. Test may need re-authentication.",
        );
        throw new Error(
          "Authentication session is invalid. Please re-run setup tests.",
        );
      }

      // Verify user is authenticated
      const isAuthenticated = await verifyAuthentication(page);
      if (!isAuthenticated) {
        throw new Error(
          "Authentication verification failed. Session may have expired.",
        );
      }
    } catch (error) {
      // Only fail if this looks like an authentication issue
      // Allow network errors to pass through to the test
      if (
        error instanceof Error &&
        error.message.includes("Authentication")
      ) {
        console.error("❌ Pre-test authentication check failed:", error);
        throw error;
      }
    }

    // Run the test
    await use(page);

    // After test: check if we ended up on login page (might indicate session expiry during test)
    if (await isOnLoginPage(page)) {
      console.warn(
        "⚠️ Test ended on login page. Session may have expired during test execution.",
      );
    }
  },
});

export { expect };
