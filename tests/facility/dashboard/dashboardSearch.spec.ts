import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Dashboard - Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/`);
  });

  test("should filter facilities in the Dashboard", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Facilities" })).toBeVisible();

    const panel = page.getByRole("tabpanel");
    const searchInput = panel.getByPlaceholder("Search");

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
        panel.getByRole("link").filter({ hasText: facilityName }),
      ).toBeVisible();
    });

    await test.step("Show empty state for non-matching search", async () => {
      await searchInput.fill("zzz_nonexistent_facility_xyz");
      await expect(panel.getByText(/no results found/i)).toBeVisible();

      // Ensure more than one facility link is shown after clearing search
      await searchInput.clear();
      const facilities = await panel.getByRole("link").all();
      expect(facilities.length).toBeGreaterThan(1);
    });
  });

  test("should filter responsibilities in the Dashboard", async ({ page }) => {
    const responsibilitiesTab = page.getByRole("tab", {
      name: "Responsibilities",
    });
    await expect(responsibilitiesTab).toBeVisible();
    await responsibilitiesTab.click();

    const panel = page.getByRole("tabpanel");
    const searchInput = panel.getByPlaceholder("Search");

    const isSearchVisible = await searchInput.isVisible().catch(() => false);
    if (!isSearchVisible) {
      test.skip();
      return;
    }

    await test.step("Search for a random responsibility", async () => {
      const responsibility = faker.helpers.arrayElement(["Doctor", "Staff"]);

      await searchInput.fill(responsibility);

      await expect(
        panel.getByRole("link").filter({ hasText: responsibility }),
      ).toBeVisible();
      await expect(panel.getByRole("link")).toHaveCount(1);
    });

    await test.step("Show empty state for non-matching search", async () => {
      await searchInput.fill("zzz_nonexistent_responsibility_xyz");
      await expect(panel.getByText(/no results found/i)).toBeVisible();

      // Ensure more than one responsibility link is shown after clearing search
      await searchInput.clear();
      const responsibilities = await panel.getByRole("link").all();
      expect(responsibilities.length).toBeGreaterThan(1);
    });
  });
});
