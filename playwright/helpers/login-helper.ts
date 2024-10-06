import { BrowserContext, Page } from "@playwright/test";

export async function loginAsDistrictAdmin(
  context: BrowserContext,
): Promise<void> {
  const page: Page = await context.newPage();
  await page.goto("/login"); // Adjust this to your login page URL

  // Perform the login actions, adjust selectors as needed
  await page.fill("#username", "district-admin"); // Enter the admin username
  await page.fill("#password", "password123"); // Enter the admin password
  await page.click('button[type="submit"]'); // Click the login button

  // Save the logged-in state for reuse
  await context.storageState({ path: "storageState.json" });
  await page.close();
}
