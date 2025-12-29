import { expect, test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";
import { loginWithCredentials } from "../helper/auth";

const authFile = "tests/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Ensure the .auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Remove existing auth file to ensure fresh authentication
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile);
  }

  // Perform login with retry logic
  await loginWithCredentials(page, "admin", "admin", {
    timeout: 15000,
    retries: 2,
  });

  // Save signed-in state to 'authFile'
  await page.context().storageState({ path: authFile });

  console.log(`✅ Authentication state saved to ${authFile}`);
});
