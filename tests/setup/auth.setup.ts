import { test as setup } from "@playwright/test";
import { ensureAuthenticated } from "tests/support/authUtils";

const authFile = "tests/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await ensureAuthenticated(page, authFile);
});
