import playwrightConfig from "@/playwright.config";
import {
  APIRequestContext,
  request as playwrightRequest,
} from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Retrieves the authentication token from the stored auth file
 */
function getAuthToken(): string {
  const authFile = path.join(__dirname, "../.auth/user.json");
  const authData = JSON.parse(fs.readFileSync(authFile, "utf-8"));

  const localStorage = authData.origins[0]?.localStorage || [];
  const tokenItem = localStorage.find(
    (item: { name: string }) => item.name === "care_access_token",
  );

  if (!tokenItem?.value) {
    throw new Error("Access token not found in auth file");
  }

  return tokenItem.value;
}

/**
 * Creates an authenticated API request context with the configured base URL and headers
 */
export async function createAuthenticatedAPIContext(): Promise<APIRequestContext> {
  const token = getAuthToken();
  const baseURL =
    (playwrightConfig.use as any)?.apiBaseURL || "http://localhost:9000";

  return await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
