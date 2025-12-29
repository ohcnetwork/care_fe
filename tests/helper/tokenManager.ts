import { Page } from "@playwright/test";

/**
 * Token refresh interval check - runs every 30 seconds
 */
const TOKEN_CHECK_INTERVAL = 30000;

/**
 * Token expiry buffer - refresh if token expires in less than 5 minutes
 */
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

interface TokenInfo {
  access: string;
  refresh: string;
  accessExpiry?: number;
}

/**
 * Extract token expiry time from JWT token
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

/**
 * Check if token needs refresh
 */
function shouldRefreshToken(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return false;
  
  const now = Date.now();
  const timeUntilExpiry = expiry - now;
  
  return timeUntilExpiry < TOKEN_EXPIRY_BUFFER;
}

/**
 * Refresh authentication token via API
 */
async function refreshAuthToken(page: Page, refreshToken: string): Promise<TokenInfo | null> {
  try {
    const baseURL = page.context()._options.baseURL || "http://localhost:4000";
    const apiURL = process.env.REACT_CARE_API_URL || "http://localhost:9000";
    
    console.log("🔄 Refreshing authentication token...");
    
    const response = await page.request.post(`${apiURL}/api/v1/auth/token/refresh/`, {
      data: { refresh: refreshToken },
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok()) {
      console.error("❌ Token refresh failed:", response.status());
      return null;
    }

    const data = await response.json();
    console.log("✅ Token refreshed successfully");
    
    return {
      access: data.access,
      refresh: data.refresh || refreshToken,
    };
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return null;
  }
}

/**
 * Update tokens in localStorage via page evaluation
 */
async function updateTokensInStorage(page: Page, tokens: TokenInfo): Promise<void> {
  await page.evaluate(
    ({ access, refresh }) => {
      localStorage.setItem("care_access_token", access);
      if (refresh) {
        localStorage.setItem("care_refresh_token", refresh);
      }
    },
    tokens,
  );
}

/**
 * Get current tokens from localStorage
 */
async function getTokensFromStorage(page: Page): Promise<TokenInfo | null> {
  try {
    return await page.evaluate(() => {
      const access = localStorage.getItem("care_access_token");
      const refresh = localStorage.getItem("care_refresh_token");
      
      if (!access || !refresh) return null;
      
      return { access, refresh };
    });
  } catch {
    return null;
  }
}

/**
 * Setup automatic token refresh for a page
 * This monitors tokens and refreshes them before they expire
 */
export async function setupTokenRefresh(page: Page): Promise<void> {
  // Check and refresh token immediately if needed
  const tokens = await getTokensFromStorage(page);
  if (tokens && shouldRefreshToken(tokens.access)) {
    const newTokens = await refreshAuthToken(page, tokens.refresh);
    if (newTokens) {
      await updateTokensInStorage(page, newTokens);
    }
  }
}

/**
 * Check if current page shows session expired / login page
 */
export async function isSessionExpired(page: Page): Promise<boolean> {
  const url = page.url();
  const isLoginPage = url.includes("/login") || url.includes("/session-expired");
  
  if (isLoginPage) {
    return true;
  }
  
  // Check for session expired message in page
  const sessionExpiredText = await page
    .getByText(/session.*expired|please.*login|unauthorized/i)
    .first()
    .isVisible()
    .catch(() => false);
  
  return sessionExpiredText;
}

/**
 * Recover from session expiry by refreshing token
 */
export async function recoverFromSessionExpiry(
  page: Page,
  username: string,
  password: string,
): Promise<boolean> {
  console.log("⚠️ Session expired detected, attempting recovery...");
  
  // First, try to refresh token from storage
  const tokens = await getTokensFromStorage(page);
  if (tokens?.refresh) {
    const newTokens = await refreshAuthToken(page, tokens.refresh);
    if (newTokens) {
      await updateTokensInStorage(page, newTokens);
      
      // Navigate back to a safe page to verify
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 10000 });
      
      const stillExpired = await isSessionExpired(page);
      if (!stillExpired) {
        console.log("✅ Recovered from session expiry via token refresh");
        return true;
      }
    }
  }
  
  // If token refresh failed, try re-login
  console.log("🔄 Token refresh failed, attempting re-login...");
  
  try {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 10000 });
    
    await page.getByRole("textbox", { name: /username/i }).fill(username);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /login/i }).click();
    
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });
    
    console.log("✅ Re-logged in successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to recover from session expiry:", error);
    return false;
  }
}
