import { ensureAuthenticated } from "@/tests/support/authUtils";
import { test as setup } from "@playwright/test";

const authFile = "tests/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await ensureAuthenticated(page, authFile);
});
