import { Page } from "@playwright/test";

/**
 * Checks if the current page indicates session expiration
 */
export async function isSessionExpired(page: Page): Promise<boolean> {
  const url = page.url();
  
  // Check if redirected to login or session expired page
  if (url.includes("/login") || url.includes("/session-expired") || url.includes("/unauthorized")) {
    return true;
  }
  
  // Check for session expired messages
  const sessionExpiredIndicators = [
    /session.*expired/i,
    /please.*log.*in/i,
    /unauthorized/i,
    /authentication.*required/i,
  ];
  
  for (const pattern of sessionExpiredIndicators) {
    const hasMessage = await page.getByText(pattern).first().isVisible({ timeout: 1000 }).catch(() => false);
    if (hasMessage) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extracts token expiry time from JWT token
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

/**
 * Checks if a token will expire soon (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string, bufferMs: number = 5 * 60 * 1000): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return false;
  
  const timeUntilExpiry = expiry - Date.now();
  return timeUntilExpiry < bufferMs;
}

/**
 * Refreshes authentication token using the refresh token
 */
export async function refreshAuthToken(
  page: Page,
  refreshToken: string,
): Promise<{ access: string; refresh?: string } | null> {
  try {
    const apiURL = process.env.REACT_CARE_API_URL || "http://localhost:9000";
    
    console.log("🔄 Refreshing authentication token...");
    
    const response = await page.request.post(`${apiURL}/api/v1/auth/token/refresh/`, {
      data: { refresh: refreshToken },
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok()) {
      console.error(`❌ Token refresh failed with status: ${response.status()}`);
      return null;
    }

    const data = await response.json();
    console.log("✅ Token refreshed successfully");
    
    return {
      access: data.access,
      refresh: data.refresh,
    };
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return null;
  }
}

/**
 * Gets tokens from page localStorage
 */
export async function getTokensFromPage(page: Page): Promise<{ access: string; refresh: string } | null> {
  try {
    const tokens = await page.evaluate(() => {
      const access = localStorage.getItem("care_access_token");
      const refresh = localStorage.getItem("care_refresh_token");
      
      if (!access || !refresh) return null;
      
      return { access, refresh };
    });
    
    return tokens;
  } catch {
    return null;
  }
}

/**
 * Updates tokens in page localStorage
 */
export async function updateTokensInPage(
  page: Page,
  tokens: { access: string; refresh?: string },
): Promise<void> {
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
 * Checks and refreshes token if needed before test execution
 * This function should be called at the start of tests that use authentication
 */
export async function ensureValidToken(page: Page): Promise<boolean> {
  try {
    // Get current tokens from localStorage
    const tokens = await getTokensFromPage(page);
    
    if (!tokens) {
      console.log("ℹ️ No tokens found in localStorage");
      return false;
    }
    
    // Check if access token is expiring soon
    if (isTokenExpiringSoon(tokens.access)) {
      console.log("⚠️ Access token expiring soon, refreshing...");
      
      // Refresh the token
      const newTokens = await refreshAuthToken(page, tokens.refresh);
      
      if (newTokens) {
        // Update tokens in localStorage
        await updateTokensInPage(page, newTokens);
        console.log("✅ Tokens updated in localStorage");
        return true;
      } else {
        console.error("❌ Failed to refresh token");
        return false;
      }
    }
    
    // Token is still valid
    return true;
  } catch (error) {
    console.error("❌ Error ensuring valid token:", error);
    return false;
  }
}
