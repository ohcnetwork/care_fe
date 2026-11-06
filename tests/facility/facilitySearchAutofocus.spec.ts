import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Search Autofocus", () => {
  test("autofocuses the search input on /facilities at desktop width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/facilities");
    const searchInput = page.locator("#facility-search");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
  });

  test("does not autofocus the search input on /facilities at mobile width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/facilities");
    const searchInput = page.locator("#facility-search");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).not.toBeFocused();
  });
});
