import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";

/**
 * Organization Facilities Page E2E tests
 * Covers: listing, search, and navigation to facility details from organization facilities page.
 */
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Organization Facilities Page", () => {
  const orgId = "1"; // TODO: Use a fixture or dynamic org if available

  test("should list facilities and allow navigation to facility details", async ({ page }) => {
    await page.goto(`/organization/${orgId}/facilities`);
    // Wait for facilities to load
    await expect(page.getByRole("heading", { name: /facilities/i })).toBeVisible();
    // At least one facility card should be visible (if any exist)
    const cards = page.locator("[data-testid='facility-card']");
    if (await cards.count() > 0) {
      await expect(cards.first()).toBeVisible();
      // Click the first "View Facility" link
      await page.getByRole("link", { name: /view facility/i }).first().click();
      // Should navigate to facility details page
      await expect(page.getByRole("heading")).toBeVisible();
      await expect(page).toHaveURL(/\/facility\/.+\/settings\/general/);
    } else {
      // If no facilities, show empty state
      await expect(page.getByText(/no facilities found/i)).toBeVisible();
    }
  });

  test("should filter facilities by name", async ({ page }) => {
    await page.goto(`/organization/${orgId}/facilities`);
    // Wait for search input
    const searchInput = page.getByPlaceholder(/search by facility name/i);
    await expect(searchInput).toBeVisible();
    // Enter a random string (should show empty state)
    const randomName = faker.company.name();
    await searchInput.fill(randomName);
    await expect(page.getByText(/no facilities found/i)).toBeVisible();
  });

  test("should show Add Facility button if user has permission", async ({ page }) => {
    await page.goto(`/organization/${orgId}/facilities`);
    // Button should be visible for permitted users
    const addBtn = page.getByRole("button", { name: /add facility/i });
    await expect(addBtn).toBeVisible();
  });
});
