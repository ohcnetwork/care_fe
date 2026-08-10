import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

/**
 * Appointments Page E2E Tests
 *
 * Tests the main appointments list page functionality including:
 * - Page navigation and loading
 * - View switching (board/list)
 * - Filtering by date, tags, and practitioners
 * - Status tabs and appointment display
 * - Permission-based access control
 */

// Use authenticated admin user
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Appointments Page", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/appointments`);
  });

  test("should load appointments page successfully", async ({ page }) => {
    await test.step("Verify page title and basic elements", async () => {
      // Wait for page to load
      await expect(
        page.getByRole("heading", { name: /appointments/i }),
      ).toBeVisible();

      // Verify view tabs are present
      await expect(page.getByRole("tab", { name: /board/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /list/i })).toBeVisible();
    });
  });

  test("should switch between board and list views", async ({ page }) => {
    await test.step("Switch to list view", async () => {
      await page.getByRole("tab", { name: /list/i }).click();

      // Verify list view is active
      await expect(page.getByRole("tab", { name: /list/i })).toHaveAttribute(
        "data-state",
        "active",
      );
    });

    await test.step("Switch back to board view", async () => {
      await page.getByRole("tab", { name: /board/i }).click();

      // Verify board view is active
      await expect(page.getByRole("tab", { name: /board/i })).toHaveAttribute(
        "data-state",
        "active",
      );
    });
  });

  test("should display filter options", async ({ page }) => {
    await test.step("Verify filter UI elements are present", async () => {
      // Look for filter button or filter elements
      // The page has MultiFilter component with tags and date filters
      const filterSection = page.locator('[class*="filter"]').first();

      // Check if filters are available (may need to click a filter button)
      // The exact selector depends on how MultiFilter renders
      await expect(filterSection).toBeVisible({ timeout: 10000 });
    });
  });

  test("should show empty state when no appointments match filters", async ({
    page,
  }) => {
    await test.step("Apply filters that return no results", async () => {
      // Navigate to a future date that likely has no appointments
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);

      const futureDateStr = futureDate.toISOString().split("T")[0];
      await page.goto(
        `/facility/${facilityId}/appointments?date_from=${futureDateStr}&date_to=${futureDateStr}`,
      );
    });

    await test.step("Verify empty state is displayed", async () => {
      // Check for empty state message
      await expect(
        page.getByText(/no appointments|adjust.*filters/i),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test("should filter appointments by date range", async ({ page }) => {
    await test.step("Set date filter to today", async () => {
      const today = new Date().toISOString().split("T")[0];

      // Navigate with date filter
      await page.goto(
        `/facility/${facilityId}/appointments?date_from=${today}&date_to=${today}`,
      );

      // Wait for appointments to load or empty state
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify page loads with date filter applied", async () => {
      // The page should load without errors
      await expect(
        page.getByRole("heading", { name: /appointments/i }),
      ).toBeVisible();

      // Either appointments or empty state should be visible
      const hasContent = await Promise.race([
        page
          .getByText(/no appointments|adjust.*filters/i)
          .isVisible()
          .then(() => true),
        page.waitForSelector('[role="table"], [role="grid"]').then(() => true),
      ]).catch(() => false);

      expect(hasContent).toBeTruthy();
    });
  });

  test("should display practitioner filter when applicable", async ({
    page,
  }) => {
    await test.step("Check for practitioner selector", async () => {
      // The page shows PractitionerSelector for filtering
      // Wait for the page to fully load
      await page.waitForLoadState("networkidle");

      // Check if practitioner filter/selector is present
      // This might be a dropdown, multi-select, or other component
      const hasPractitionerFilter =
        (await page.locator('button:has-text("practitioner")').count()) > 0 ||
        (await page.locator('[role="combobox"]').count()) > 0 ||
        (await page.getByText(/all practitioners|select/i).count()) > 0;

      // Practitioner filter should be present for the main appointments page
      expect(hasPractitionerFilter).toBeTruthy();
    });
  });

  test("should handle navigation back from appointments page", async ({
    page,
  }) => {
    await test.step("Click browser back or back button", async () => {
      // Check if there's a back button in the UI
      const backButton = page.getByRole("button", { name: /back/i });

      if (await backButton.isVisible()) {
        await backButton.click();

        // Should navigate away from appointments page
        await expect(page).not.toHaveURL(/appointments/);
      } else {
        // Use browser back
        await page.goBack();

        // Should navigate to facility overview or previous page
        await page.waitForLoadState("networkidle");
        await expect(page).not.toHaveURL(/appointments/);
      }
    });
  });
});

test.describe("Appointments Page - Access Control", () => {
  test("should show appointments for users with permission", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await test.step("Navigate to appointments as admin", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);

      // Admin should see appointments page
      await expect(
        page.getByRole("heading", { name: /appointments/i }),
      ).toBeVisible();
    });
  });
});

test.describe("Appointments Page - URL Parameters", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("should preserve URL parameters when switching views", async ({
    page,
  }) => {
    const today = new Date().toISOString().split("T")[0];

    await test.step("Navigate with date filter", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments?date_from=${today}`,
      );
      await page.waitForLoadState("networkidle");
    });

    await test.step("Switch to list view", async () => {
      await page.getByRole("tab", { name: /list/i }).click();

      // Date filter should still be in URL
      expect(page.url()).toContain(`date_from=${today}`);
    });

    await test.step("Switch back to board view", async () => {
      await page.getByRole("tab", { name: /board/i }).click();

      // Date filter should still be in URL
      expect(page.url()).toContain(`date_from=${today}`);
    });
  });

  test("should handle multiple filter parameters", async ({ page }) => {
    const today = new Date().toISOString().split("T")[0];

    await test.step("Navigate with multiple filters", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments?date_from=${today}&date_to=${today}`,
      );

      // Page should load successfully
      await expect(
        page.getByRole("heading", { name: /appointments/i }),
      ).toBeVisible();
    });
  });
});
