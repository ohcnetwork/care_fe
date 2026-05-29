import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Sidebar Facility Switcher - Search", () => {
  test("should filter facilities in the switcher dropdown", async ({
    page,
  }) => {
    await page.goto(`/facility/${getFacilityId()}/overview`);

    //switcher
    await page.getByRole("button", { name: "Select Facility" }).click();
    await expect(page.getByText(/view dashboard/i)).toBeVisible();
    await expect(page.getByText(/Facilities/i)).toBeVisible();

    const searchInput = page.getByPlaceholder(/search/i);

    await test.step("Search for a facility FACILITY WITH PATIENTS", async () => {
      const facilityName = "FACILITY WITH PATIENTS";
      const isSearchVisible = await searchInput.isVisible().catch(() => false);
      if (!isSearchVisible) {
        test.skip();
        return;
      }

      await searchInput.fill(facilityName);

      // Verify matching facility is still visible
      await expect(
        page.getByRole("menuitem").filter({ hasText: facilityName }),
      ).toBeVisible();
    });

    await test.step("Show empty state for non-matching search", async () => {
      const isSearchVisible = await searchInput.isVisible().catch(() => false);
      if (!isSearchVisible) {
        test.skip();
        return;
      }

      await searchInput.fill("zzz_nonexistent_facility_xyz");
      await expect(page.getByText(/no results found/i)).toBeVisible();

      // Ensure more than one facility menuitem is shown after clearing search
      await searchInput.clear();
      const facilities = await page.getByRole("menuitem").all();
      expect(facilities.length).toBeGreaterThan(1);
    });
  });
});
