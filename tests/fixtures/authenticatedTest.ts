import { test as base, expect } from "@playwright/test";
import { verifyAuthentication, isOnLoginPage } from "../helper/auth";

/**
 * Extended Playwright test fixture that automatically verifies authentication
 * before each test and provides utilities for handling session expiration.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Before test: verify authentication if a storage state is configured
    const context = page.context();
    const hasStorageState = context._options?.storageState;

    if (hasStorageState) {
      // Navigate to a protected route to check if session is valid
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
        console.error("❌ Pre-test authentication check failed:", error);
        throw error;
      }
    }

    // Run the test
    await use(page);

    // After test: check if we ended up on login page (might indicate session expiry during test)
    if (hasStorageState && (await isOnLoginPage(page))) {
      console.warn(
        "⚠️ Test ended on login page. Session may have expired during test execution.",
      );
    }
  },
});

export { expect };
