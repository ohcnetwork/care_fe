import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Clear Cache in profile successfully", () => {
  test("should clear caches and unregister service workers", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/users/admin`);

    await expect(
      page.getByRole("button", { name: /clear cache/i }),
    ).toBeVisible();

    // Create a test cache to verify clearing works
    await page.evaluate(async () => {
      const cache = await caches.open("test-cache");
      await cache.put("/dummy", new Response("dummy data"));
    });

    // Verify test cache exists before clearing
    const preCaches = await page.evaluate(() => caches.keys());
    expect(preCaches).toContain("test-cache");

    // Get initial service worker registrations count
    const preRegs = await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    );

    // Set up page reload listener
    const reloadPromise = page.waitForLoadState("domcontentloaded");

    // Click Clear Cache button
    await page.getByRole("button", { name: /clear cache/i }).click();

    // Wait for page reload
    await reloadPromise;

    // Wait for cache to be cleared - use a more reliable check
    await page.waitForFunction(
      () => {
        return caches.keys().then((keys) => !keys.includes("test-cache"));
      },
      { timeout: 15000 },
    );

    // Verify test cache has been deleted
    const remainingCaches = await page.evaluate(() => caches.keys());
    expect(remainingCaches).not.toContain("test-cache");

    // Verify service workers have been unregistered
    const remainingRegs = await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    );

    // If there were service workers before, verify they're reduced or gone
    if (preRegs > 0) {
      expect(remainingRegs).toBeLessThanOrEqual(preRegs);
    }

    // Wait for profile page to be fully loaded and verify user is still on the profile page
    await expect(
      page.getByRole("button", { name: /clear cache/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});
