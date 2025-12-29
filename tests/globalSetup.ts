import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Global setup that runs once before all tests.
 * Refreshes authentication tokens to ensure they're valid for the test run.
 */
async function globalSetup(config: FullConfig) {
  const authFile = path.join(__dirname, ".auth/user.json");
  
  // Check if auth file exists
  if (!fs.existsSync(authFile)) {
    console.log("⚠️ Auth file not found, skipping token refresh");
    return;
  }

  try {
    // Read the current storage state
    const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
    
    // Extract tokens from localStorage
    const localStorage = storageState.origins?.[0]?.localStorage || [];
    const accessTokenEntry = localStorage.find((item: any) => item.name === "care_access_token");
    const refreshTokenEntry = localStorage.find((item: any) => item.name === "care_refresh_token");
    
    if (!accessTokenEntry || !refreshTokenEntry) {
      console.log("⚠️ No tokens found in storage state");
      return;
    }

    const refreshToken = refreshTokenEntry.value;
    const apiURL = process.env.REACT_CARE_API_URL || "http://localhost:9000";

    console.log("🔄 Refreshing authentication tokens...");

    // Launch a browser to make the API call
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Call the token refresh endpoint
      const response = await page.request.post(`${apiURL}/api/v1/auth/token/refresh/`, {
        data: { refresh: refreshToken },
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok()) {
        const data = await response.json();
        
        // Update tokens in localStorage
        const accessIndex = localStorage.findIndex((item: any) => item.name === "care_access_token");
        const refreshIndex = localStorage.findIndex((item: any) => item.name === "care_refresh_token");
        
        if (accessIndex !== -1) {
          localStorage[accessIndex].value = data.access;
        }
        if (refreshIndex !== -1 && data.refresh) {
          localStorage[refreshIndex].value = data.refresh;
        }

        // Write updated storage state back to file
        fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
        
        console.log("✅ Tokens refreshed successfully");
      } else {
        console.log(`⚠️ Token refresh failed with status: ${response.status()}`);
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("❌ Error refreshing tokens:", error);
    // Don't fail the test run, just log the error
  }
}

export default globalSetup;
