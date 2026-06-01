import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Dashboard - Facility Search", () => {
  test("should filter facilities in the Dashboard", async ({ page }) => {
    await page.goto(`/`);
    await expect(page.getByRole("tab", { name: "Facilities" })).toBeVisible();
    const searchInput = page.getByPlaceholder(/Search Facilities/i);

    // If more than 1 facility exists, search should be visible; otherwise skip
    const initialFacilities = await page.getByRole("link").all();
    if (initialFacilities.length <= 1) {
      test.skip();
      return;
    }

    const isSearchVisible = await searchInput.isVisible().catch(() => false);
    if (!isSearchVisible) {
      test.skip();
      return;
    }

    await test.step("Search for a facility FACILITY WITH PATIENTS", async () => {
      const facilityName = "FACILITY WITH PATIENTS";

      await searchInput.fill(facilityName);

      // Verify matching facility is still visible
      await expect(
        page.getByRole("link").filter({ hasText: facilityName }),
      ).toBeVisible();
    });

    await test.step("Show empty state for non-matching search", async () => {
      await searchInput.fill("zzz_nonexistent_facility_xyz");
      await expect(page.getByText(/no facilities found/i)).toBeVisible();

      // Ensure more than one facility link is shown after clearing search
      await searchInput.clear();
      const facilities = await page.getByRole("link").all();
      expect(facilities.length).toBeGreaterThan(2);
    });
  });
});
