import { expect, test } from "@playwright/test";

test.describe("User routes", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("/user goes to /users and keeps the query", async ({ page }) => {
    await page.goto("/user?x=1");

    await expect(page).toHaveURL(/\/users\?x=1$/);
  });

  test("/user/<tab> stays on the page of the own account", async ({ page }) => {
    await page.goto("/user/theme");

    await expect(page).toHaveURL(/\/user\/theme$/);
    await expect(page.locator("#usermanagement_tab_nav")).toBeVisible();
    await expect(page.locator("#theme")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("/users/<username> opens the profile tab", async ({ page }) => {
    await page.goto("/users/admin");

    await expect(page.locator("#usermanagement_tab_nav")).toBeVisible();
    await expect(page.locator("#profile")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
