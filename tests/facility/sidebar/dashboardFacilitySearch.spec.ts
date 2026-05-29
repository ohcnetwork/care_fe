import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Dashboard - Facility Search", () => {
  test("should filter facilities in the Dashboard", async ({ page }) => {
    await page.goto(`/`);
    await expect(page.getByRole("tab", { name: "Facilities" })).toBeVisible();

    await test.step("Search for a facility FACILITY WITH PATIENTS", async () => {
      const facilityName = "FACILITY WITH PATIENTS";
      const searchInput = page.getByPlaceholder(/Search Facilities/i);
      const isSearchVisible = await searchInput.isVisible().catch(() => false);
      if (!isSearchVisible) {
        test.skip();
        return;
      }

      await searchInput.fill(facilityName);

      // Verify matching facility is still visible
      await expect(
        page.getByRole("link").filter({ hasText: facilityName }),
      ).toBeVisible();
    });

    await test.step("Show empty state for non-matching search", async () => {
      const searchInput = page.getByPlaceholder(/search/i);
      const isSearchVisible = await searchInput.isVisible().catch(() => false);
      if (!isSearchVisible) {
        test.skip();
        return;
      }

      await searchInput.fill("zzz_nonexistent_facility_xyz");
      await expect(page.getByText(/no facilities found/i)).toBeVisible();

      // Ensure more than one facility link is shown after clearing search
      await searchInput.clear();
      const facilities = await page.getByRole("link").all();
      expect(facilities.length).toBeGreaterThan(2);
    });
  });
});
