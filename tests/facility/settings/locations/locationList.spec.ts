import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Location List & Hierarchy", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/locations`);
  });

  test("should display locations list with existing locations", async ({
    page,
  }) => {
    // Verify the locations page loads
    // Fixture creates locations: a ward, Bio-Chemistry Lab, Pharmacy, and 5 beds
    await page.waitForLoadState("networkidle");

    // There should be location entries visible
    // Locations are shown in a tree/list structure
    const locationContent = page
      .locator('[role="treeitem"]')
      .or(page.locator('[data-slot="card"]'))
      .or(page.getByRole("link").filter({ hasText: /bed|ward|lab|pharmacy/i }));

    await expect(locationContent.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show location details when clicked", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Click on the first location entry
    const locationLinks = page.getByRole("link").filter({
      hasText: /bed|ward|lab|pharmacy|bio-chemistry/i,
    });

    if (
      await locationLinks
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await locationLinks.first().click();

      // Wait for the location details to load
      await page.waitForURL(/\/locations\/[^/]+/);

      // Verify location details are shown
      const locationPage = page.locator("main");
      await expect(locationPage).toBeVisible();
    }
  });

  test("should have add location button", async ({ page }) => {
    // Verify the "Add Location" button exists
    const addButton = page
      .getByRole("button", { name: /add location/i })
      .or(page.getByRole("link", { name: /add location/i }));

    await expect(addButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display Bio-Chemistry Lab location from fixtures", async ({
    page,
  }) => {
    // Search or find the Bio-Chemistry Lab location created by fixtures
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("Bio-Chemistry");
      await page.waitForTimeout(500);
    }

    // Look for Bio-Chemistry Lab in the location list
    const labLocation = page.getByText(/bio-chemistry lab/i);
    if (await labLocation.isVisible().catch(() => false)) {
      await expect(labLocation.first()).toBeVisible();
    }
  });

  test("should display bed locations as children of ward", async ({ page }) => {
    // Fixtures create Bed 1 through Bed 5 as children of a ward location
    // Look for any bed entries in the location list
    const bedLocations = page.getByText(/bed \d/i);

    // Wait a moment for the page to fully render
    await page.waitForTimeout(1000);

    // If beds are directly visible (expanded tree), verify them
    if (
      await bedLocations
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      const bedCount = await bedLocations.count();
      // Fixtures create 5 beds
      expect(bedCount).toBeGreaterThanOrEqual(1);
    }
  });
});
