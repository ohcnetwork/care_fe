import { expect, type Page } from "@playwright/test";

/**
 * Verifies that the user is authenticated by checking for user-specific elements.
 * This function can be called at the start of tests to ensure the session is still valid.
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 * @throws Will throw an error if authentication verification fails
 *
 * @example
 * await verifyAuthentication(page);
 */
export async function verifyAuthentication(
  page: Page,
  options: { timeout?: number } = {},
): Promise<boolean> {
  const timeout = options.timeout || 10000;

  try {
    // Navigate to home page to verify authentication
    await page.goto("/", { waitUntil: "domcontentloaded", timeout });

    // Check for authenticated user indicator
    const userHeading = page.getByRole("heading", { name: /^Hey .+/ });
    await expect(userHeading).toBeVisible({ timeout: 5000 });

    return true;
  } catch (error) {
    console.error("Authentication verification failed:", error);
    return false;
  }
}

/**
 * Checks if the current page is a login or session-expired page.
 * This can be used to detect if a session has expired during test execution.
 *
 * @param page - Playwright page object
 * @returns True if on login page, false otherwise
 *
 * @example
 * if (await isOnLoginPage(page)) {
 *   console.log("Session expired, need to re-authenticate");
 * }
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  const url = page.url();
  return (
    url.includes("/login") ||
    url.includes("/session-expired") ||
    url.includes("/unauthorized")
  );
}

/**
 * Performs login with the given credentials and waits for successful authentication.
 * This function provides robust error handling and proper wait conditions.
 *
 * @param page - Playwright page object
 * @param username - Username for login
 * @param password - Password for login
 * @param options - Configuration options
 * @throws Will throw an error if login fails after retries
 *
 * @example
 * await loginWithCredentials(page, "admin", "admin");
 */
export async function loginWithCredentials(
  page: Page,
  username: string,
  password: string,
  options: { timeout?: number; retries?: number } = {},
): Promise<void> {
  const timeout = options.timeout || 15000;
  const retries = options.retries || 2;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Navigate to login page
      await page.goto("/login", { waitUntil: "domcontentloaded", timeout });

      // Wait for login form to be ready
      const usernameField = page.getByRole("textbox", { name: /username/i });
      await usernameField.waitFor({ state: "visible", timeout: 5000 });

      // Fill in credentials
      await usernameField.clear();
      await usernameField.fill(username);

      const passwordField = page.getByLabel(/password/i);
      await passwordField.clear();
      await passwordField.fill(password);

      // Click login button
      const loginButton = page.getByRole("button", { name: /login/i });
      await loginButton.click();

      // Wait for successful login - redirect away from login page
      await page.waitForURL(/(?!.*login)/, { timeout });

      // Verify we're logged in by checking for user-specific elements
      await expect(page.getByRole("heading", { name: /^Hey .+/ })).toBeVisible({
        timeout: 5000,
      });

      console.log(`✅ Successfully logged in as ${username}`);
      return;
    } catch (error) {
      if (attempt < retries) {
        console.warn(
          `⚠️ Login attempt ${attempt + 1} failed, retrying...`,
          error,
        );
        await page.waitForTimeout(1000 * (attempt + 1)); // Exponential backoff
      } else {
        console.error(`❌ Login failed after ${retries + 1} attempts:`, error);
        throw new Error(
          `Failed to login as ${username} after ${retries + 1} attempts`,
        );
      }
    }
  }
}

/**
 * Ensures the user is authenticated and re-authenticates if necessary.
 * This function can be called at the start of tests to ensure a valid session.
 *
 * @param page - Playwright page object
 * @param username - Username for re-authentication if needed
 * @param password - Password for re-authentication if needed
 *
 * @example
 * await ensureAuthentication(page, "admin", "admin");
 */
export async function ensureAuthentication(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  // First, check if we're already authenticated
  const isAuthenticated = await verifyAuthentication(page);

  if (!isAuthenticated) {
    console.log(
      `⚠️ Session expired or invalid, re-authenticating as ${username}...`,
    );
    await loginWithCredentials(page, username, password);
  }
}
