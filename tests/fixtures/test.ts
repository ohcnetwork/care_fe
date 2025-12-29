import { test as baseTest } from "@playwright/test";
import { ensureValidToken, isSessionExpired } from "../utils/tokenManager";

/**
 * Extended test with automatic token refresh handling.
 * This works globally without requiring changes to individual test files.
 */
export const test = baseTest.extend({
  page: async ({ page }, use) => {
    // Before each test: Check and refresh token if needed
    const originalGoto = page.goto.bind(page);
    
    // Wrap page.goto to check tokens before navigation
    page.goto = async (url: string | URL, options?) => {
      // First navigate to establish context
      const response = await originalGoto(url, options);
      
      // After navigation, check if we have a valid token and refresh if needed
      try {
        await ensureValidToken(page);
      } catch (error) {
        console.warn("⚠️ Token refresh check failed:", error);
      }
      
      return response;
    };

    // Run the test
    await use(page);

    // After test: Check if session expired during test
    try {
      if (await isSessionExpired(page)) {
        console.warn("⚠️ Test ended with expired session");
      }
    } catch {
      // Ignore errors in cleanup
    }
  },
});

export { expect } from "@playwright/test";
