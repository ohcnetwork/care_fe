import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Token name constants
const ACCESS_TOKEN_KEY = "care_access_token";
const REFRESH_TOKEN_KEY = "care_refresh_token";

/**
 * Interface for localStorage items in Playwright storage state
 */
interface LocalStorageItem {
  name: string;
  value: string;
}

/**
 * Global setup that runs once before all tests.
 * Attempts to refresh authentication tokens if they exist.
 * If refresh fails, setup project will create fresh tokens.
 */
async function globalSetup(_config: FullConfig) {
  const authFile = path.join(__dirname, ".auth/user.json");

  if (!fs.existsSync(authFile)) return;

  try {
    const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));

    if (
      !Array.isArray(storageState.origins) ||
      storageState.origins.length === 0
    )
      return;

    const firstOrigin = storageState.origins[0];
    const localStorage: LocalStorageItem[] = Array.isArray(
      firstOrigin.localStorage,
    )
      ? firstOrigin.localStorage
      : [];
    const accessTokenEntry = localStorage.find(
      (item: LocalStorageItem) => item.name === ACCESS_TOKEN_KEY,
    );
    const refreshTokenEntry = localStorage.find(
      (item: LocalStorageItem) => item.name === REFRESH_TOKEN_KEY,
    );

    if (!accessTokenEntry || !refreshTokenEntry) return;

    const refreshToken = refreshTokenEntry.value;
    const apiUrl = process.env.REACT_CARE_API_URL || "http://localhost:9000";

    console.log("🔄 Refreshing tokens...");

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const response = await page.request.post(
        `${apiUrl}/api/v1/auth/token/refresh/`,
        {
          data: { refresh: refreshToken },
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.ok()) {
        const data = await response.json();

        const accessIndex = localStorage.findIndex(
          (item: LocalStorageItem) => item.name === ACCESS_TOKEN_KEY,
        );
        const refreshIndex = localStorage.findIndex(
          (item: LocalStorageItem) => item.name === REFRESH_TOKEN_KEY,
        );

        if (accessIndex !== -1) localStorage[accessIndex].value = data.access;
        if (refreshIndex !== -1 && data.refresh)
          localStorage[refreshIndex].value = data.refresh;

        fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
        console.log("✅ Tokens refreshed");
      }
    } finally {
      await browser.close();
    }
  } catch (_error) {
    // Silent fail - setup project will handle authentication
  }
}

export default globalSetup;
