import { chromium, type FullConfig } from "@playwright/test";
import { ensureAuthenticated } from "./support/authUtils";

async function globalSetup(config: FullConfig) {
  // Get baseURL from the first project's use options (projects inherit global config)
  const baseURL = config.projects[0]?.use?.baseURL;

  if (!baseURL) {
    throw new Error(
      "baseURL must be configured in playwright.config.ts use section",
    );
  }

  // Create a browser and context for initial authentication
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: baseURL as string });
  const page = await context.newPage();

  // Ensure we have valid authentication tokens
  await ensureAuthenticated(page);

  await page.close();
  await context.close();
  await browser.close();
}

export default globalSetup;
