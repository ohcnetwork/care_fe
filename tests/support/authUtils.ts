import { type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface AuthState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

export async function ensureAuthenticated(
  page: Page,
  authFilePath: string = "tests/.auth/user.json",
) {
  const fullPath = resolve(authFilePath);

  // Check if auth file exists
  if (!existsSync(fullPath)) {
    await authenticateAndSave(page, fullPath);
    return;
  }

  try {
    const authState: AuthState = JSON.parse(readFileSync(fullPath, "utf-8"));
    // Navigate to home page to establish URL context if not already set
    if (!page.url() || page.url() === "about:blank") {
      await page.goto("/");
    }
    const currentUrl = page.url() || "http://localhost:4000";
    const origin = authState.origins.find((o) =>
      o.origin.includes(new URL(currentUrl).host),
    );

    if (!origin) {
      await authenticateAndSave(page, fullPath);
      return;
    }

    const accessTokenItem = origin.localStorage.find(
      (item) => item.name === "care_access_token",
    );

    if (!accessTokenItem?.value) {
      await authenticateAndSave(page, fullPath);
      return;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(accessTokenItem.value.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Refresh if token expires within 5 minutes (for safety)
      if (payload.exp <= currentTime + 300) {
        console.log("Token expired or expiring soon, re-authenticating...");
        await authenticateAndSave(page, fullPath);
        return;
      }

      console.log("Token is valid, using existing authentication");
    } catch (error) {
      console.log(
        "Token validation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      await authenticateAndSave(page, fullPath);
    }
  } catch (error) {
    console.log(
      "Auth file parsing failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    await authenticateAndSave(page, fullPath);
  }
}

async function authenticateAndSave(page: Page, authFilePath: string) {
  console.log("Authenticating...");

  // Navigate to login page
  await page.goto("/login");

  // Fill in credentials from environment variables
  const username = process.env.TEST_USERNAME || "admin";
  const password = process.env.TEST_PASSWORD || "admin";

  await page.getByRole("textbox", { name: /username/i }).fill(username);
  await page.getByLabel(/password/i).fill(password);

  // Click login button
  await page.getByRole("button", { name: /login/i }).click();

  // Wait for successful login or error
  try {
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });
  } catch (_error) {
    // Check for authentication errors
    const errorMessage = await page
      .locator('[role="alert"], .error-message, [data-testid="error"]')
      .first()
      .textContent({ timeout: 2000 })
      .catch(() => null);
    throw new Error(
      `Authentication failed: ${errorMessage || "Login timeout or navigation failed"}`,
    );
  }

  // Verify we're logged in with multiple possible success indicators
  try {
    await page.waitForSelector(
      'h1:has-text("Hey"), h2:has-text("Hey"), [data-testid="user-greeting"]:has-text("Hey"), [data-testid="dashboard"], .dashboard',
      { timeout: 10000 },
    );
  } catch (_error) {
    throw new Error(
      "Authentication succeeded but could not verify logged-in state",
    );
  }

  // Ensure directory exists before saving
  const { dirname } = await import("node:path");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dirname(authFilePath), { recursive: true });

  // Save the new auth state
  await page.context().storageState({ path: authFilePath });

  console.log("Authentication successful and saved to:", authFilePath);
}
