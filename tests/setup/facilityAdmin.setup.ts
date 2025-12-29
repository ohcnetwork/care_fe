import { expect, test as setup } from "@playwright/test";

const authFile = "tests/.auth/facilityAdmin.json";

setup("authenticate as facility admin", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Fill in credentials for facility_admin_2_0
  await page
    .getByRole("textbox", { name: /username/i })
    .fill("facility_admin_2_0");
  await page.getByLabel(/password/i).fill("Coronasafe@123");

  // Click login button
  await page.getByRole("button", { name: /login/i }).click();

  // Wait for successful login
  await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

  // Verify we're logged in by checking for user-specific elements
  await expect(page.getByRole("heading", { name: /^Hey .+/ })).toBeVisible();

  // Save signed-in state to 'authFile'
  await page.context().storageState({ path: authFile });
});
