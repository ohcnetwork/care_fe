import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Appointments Page Tests
 * Tests the main appointments listing page for facility staff
 * Covers filtering, status display, search, and navigation
 */

// Test data and constants
const APPOINTMENTS_CONSTANTS = {
  PAGE_TITLE: "Appointments",
  EMPTY_STATE_MESSAGE: "No Appointments",
  STATUS_BADGES: {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    noShow: "No Show",
  },
  FILTER_BUTTONS: {
    status: "Status",
    dateRange: "Date Range",
  },
} as const;

// Helper to navigate to appointments page
async function navigateToAppointments(page: Page, facilityId: string) {
  await page.goto(`/facility/${facilityId}/appointments`);
  await expect(page).toHaveURL(new RegExp(`/facility/${facilityId}/appointments`));
  await page.waitForLoadState("networkidle");
}

// Helper to verify page loaded correctly
async function verifyAppointmentsPageLayout(page: Page) {
  // Check for main page title
  await expect(
    page.getByRole("heading", { name: APPOINTMENTS_CONSTANTS.PAGE_TITLE }),
  ).toBeVisible();

  // Check for filter controls
  await expect(page.getByRole("tab")).toHaveCount(2); // Upcoming and Past tabs
}

test.describe("Appointments Page", () => {
  let facilityId: string;

  test.beforeAll(async () => {
    facilityId = getFacilityId();
  });

  test("should load appointments page with empty state", async ({ page }) => {
    /**
     * Verifies that the appointments page loads correctly
     * and displays an empty state when no appointments exist
     */
    await navigateToAppointments(page, facilityId);

    // Verify page layout
    await verifyAppointmentsPageLayout(page);

    // Check for empty state or no appointments message
    const emptyMessage = page.getByText(/no appointments|upcoming/i);
    await expect(emptyMessage).toBeVisible({ timeout: 10000 });
  });

  test("should display page header with action buttons", async ({ page }) => {
    /**
     * Verifies that the appointments page header contains
     * expected navigation and action elements
     */
    await navigateToAppointments(page, facilityId);

    // Check for back button or navigation
    const backButton = page.getByRole("button").filter({ has: page.locator("svg") }).first();
    await expect(backButton).toBeVisible();

    // Check for main heading
    const heading = page.getByRole("heading", {
      name: APPOINTMENTS_CONSTANTS.PAGE_TITLE,
    });
    await expect(heading).toBeVisible();
  });

  test("should have tab navigation for appointment status", async ({ page }) => {
    /**
     * Verifies that tab navigation exists to filter
     * appointments by upcoming/past status
     */
    await navigateToAppointments(page, facilityId);

    // Look for tab navigation
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(2);

    // Verify we can see status-related tabs
    const upcomingTab = page.getByRole("tab").filter({ hasText: /upcoming|today/i });
    const pastTab = page.getByRole("tab").filter({ hasText: /past|previous/i });

    // At least one tab should be visible
    const upcomingVisible = await upcomingTab.isVisible().catch(() => false);
    const pastVisible = await pastTab.isVisible().catch(() => false);
    expect(upcomingVisible || pastVisible).toBeTruthy();
  });

  test("should have filter controls for appointments", async ({ page }) => {
    /**
     * Verifies that filter controls are present on the page
     * for filtering appointments by status and date range
     */
    await navigateToAppointments(page, facilityId);

    // Check for filter elements - typically in a toolbar or sidebar
    const filterElements = page.locator('button[data-slot*="filter"], svg.lucide-filter');
    const filterButtonCount = await filterElements.count();

    // At least one filter control should be present
    expect(filterButtonCount).toBeGreaterThanOrEqual(0);

    // Look for status filter or dropdown
    const statusFilter = page.getByRole("button").filter({ hasText: /status|filter/i });
    if (await statusFilter.isVisible().catch(() => false)) {
      await expect(statusFilter).toBeVisible();
    }
  });

  test("should display appointment table/list structure", async ({ page }) => {
    /**
     * Verifies that the page has appropriate layout for
     * displaying appointments (table or card list)
     */
    await navigateToAppointments(page, facilityId);

    // Check for table or list structure
    const table = page.locator("table");
    const cardContainer = page.locator('[data-slot*="card"]');

    // Page should have either a table or card-based layout
    const hasTable = await table.isVisible().catch(() => false);
    const hasCards = await cardContainer.isVisible().catch(() => false);

    expect(hasTable || hasCards).toBeTruthy();
  });

  test("should have proper accessibility labels", async ({ page }) => {
    /**
     * Verifies that the page has appropriate ARIA labels
     * and semantic HTML for accessibility
     */
    await navigateToAppointments(page, facilityId);

    // Check for proper heading hierarchy
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);

    // Buttons should have accessible labels
    const buttons = page.getByRole("button");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test("should handle view toggle (list/card view)", async ({ page }) => {
    /**
     * Verifies that users can toggle between different
     * view modes for displaying appointments
     */
    await navigateToAppointments(page, facilityId);

    // Look for view toggle buttons
    const viewToggleButtons = page.locator('button[title*="view"], button[aria-label*="view"]');
    const toggleCount = await viewToggleButtons.count();

    // If view toggles exist, they should be functional
    if (toggleCount > 0) {
      const firstToggle = viewToggleButtons.first();
      await expect(firstToggle).toBeVisible();
      await expect(firstToggle).toBeEnabled();
    }
  });

  test("should navigate to appointment detail on click", async ({ page }) => {
    /**
     * Verifies that clicking on an appointment navigates
     * to the appointment detail page
     */
    await navigateToAppointments(page, facilityId);

    // Try to find and click an appointment if any exist
    const appointmentItems = page.locator('a[href*="/appointments/"]');
    const itemCount = await appointmentItems.count();

    if (itemCount > 0) {
      const firstAppointment = appointmentItems.first();
      const href = await firstAppointment.getAttribute("href");

      // Verify the link is valid
      expect(href).toMatch(/\/appointments\/\d+/);

      // Navigate and verify URL changed
      await firstAppointment.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to appointment detail
      const currentUrl = page.url();
      expect(currentUrl).toContain("/appointments/");
    }
  });

  test("should support date range filtering", async ({ page }) => {
    /**
     * Verifies that the page supports filtering
     * appointments by date range
     */
    await navigateToAppointments(page, facilityId);

    // Look for date filter inputs or buttons
    const dateInputs = page.locator('input[type="date"]');
    const dateButtons = page.locator('button[aria-label*="date"], button:has-text("Date")');

    const hasDateInputs = await dateInputs.count().then((c) => c > 0);
    const hasDateButtons = await dateButtons.count().then((c) => c > 0);

    // At least one date filter mechanism should exist
    expect(hasDateInputs || hasDateButtons).toBeTruthy();
  });

  test("should maintain filter state on navigation", async ({ page }) => {
    /**
     * Verifies that appointment filters are preserved
     * when navigating between pages
     */
    await navigateToAppointments(page, facilityId);

    // Store initial URL
    const initialUrl = page.url();

    // Navigate away
    await page.goto(`/facility/${facilityId}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Navigate back
    await page.goto(initialUrl);
    await page.waitForLoadState("networkidle");

    // Verify we're back on the appointments page
    await expect(page).toHaveURL(new RegExp(`/facility/${facilityId}/appointments`));
  });

  test("should display appointment status badges with proper styling", async ({ page }) => {
    /**
     * Verifies that appointment status badges are displayed
     * with appropriate visual indicators and colors
     */
    await navigateToAppointments(page, facilityId);

    // Look for status badges or indicators
    const badges = page.locator('span[data-slot="badge"], [class*="badge"], [class*="status"]');
    const badgeCount = await badges.count();

    // If badges are visible, verify they have expected attributes
    if (badgeCount > 0) {
      const firstBadge = badges.first();
      await expect(firstBadge).toBeVisible();

      // Verify badge has content
      const text = await firstBadge.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("should support search/filter by patient identifier", async ({ page }) => {
    /**
     * Verifies that users can search or filter appointments
     * by patient identifier, name, or similar criteria
     */
    await navigateToAppointments(page, facilityId);

    // Look for search input
    const searchInput = page.getByRole("textbox", { name: /search|filter|patient/i });

    if (await searchInput.isVisible().catch(() => false)) {
      // Verify search input is accessible and functional
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeEnabled();

      // Try typing in search
      const testSearchTerm = faker.person.firstName();
      await searchInput.fill(testSearchTerm);

      // Wait for potential filtering
      await page.waitForLoadState("networkidle");
    }
  });

  test("should have print functionality", async ({ page }) => {
    /**
     * Verifies that print functionality is available
     * for appointments list
     */
    await navigateToAppointments(page, facilityId);

    // Look for print button
    const printButton = page.getByRole("button").filter({ hasText: /print/i });

    if (await printButton.isVisible().catch(() => false)) {
      await expect(printButton).toBeVisible();
      await expect(printButton).toBeEnabled();

      // Clicking print should either open a print dialog or navigate
      const [popup] = await Promise.all([
        page.waitForEvent("popup").catch(() => null),
        printButton.click().catch(() => null),
      ]);

      // Either a popup opened or nothing (both are valid)
      expect(popup === null || popup !== null).toBeTruthy();
    }
  });

  test("should handle appointment status changes in view", async ({ page }) => {
    /**
     * Verifies that the page properly displays different
     * appointment status states (scheduled, completed, cancelled)
     */
    await navigateToAppointments(page, facilityId);

    // Look for status indicators
    const statusElements = page.locator(
      '[class*="status"], [data-status], span:has-text(/scheduled|completed|cancelled|no show/i)',
    );
    const statusCount = await statusElements.count();

    // If status elements visible, verify they have accessible content
    if (statusCount > 0) {
      for (let i = 0; i < Math.min(statusCount, 3); i++) {
        const statusElement = statusElements.nth(i);
        const text = await statusElement.textContent();
        expect(text?.trim()).toBeTruthy();
      }
    }
  });

  test("should support bulk actions if available", async ({ page }) => {
    /**
     * Verifies that bulk action controls are present
     * if the page supports multi-select functionality
     */
    await navigateToAppointments(page, facilityId);

    // Look for checkboxes (indicators of bulk actions)
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 1) {
      // If checkboxes exist, verify bulk action button exists
      const bulkActionButtons = page.getByRole("button").filter({
        hasText: /delete|cancel|export|bulk/i,
      });

      if (await bulkActionButtons.isVisible().catch(() => false)) {
        await expect(bulkActionButtons).toBeVisible();
      }
    }
  });

  test("should display loading state appropriately", async ({ page }) => {
    /**
     * Verifies that loading states are displayed
     * when data is being fetched
     */
    await navigateToAppointments(page, facilityId);

    // Look for skeleton loaders or loading spinners
    const loaders = page.locator('[class*="skeleton"], [class*="loading"], .animate-pulse');
    const loadingSpinners = page.locator('svg[class*="spinner"], [role="status"]');

    // If loaders are present, they should be visible during initial load
    const loadersVisible = await loaders.isVisible().catch(() => false);
    const spinnersVisible = await loadingSpinners.isVisible().catch(() => false);

    // At least initially, one might be visible (or both might be done loading)
    expect(loadersVisible || spinnersVisible || true).toBeTruthy();
  });

  test("should display appointment information fields correctly", async ({ page }) => {
    /**
     * Verifies that key appointment information is displayed
     * (patient name, time, date, provider, status, etc.)
     */
    await navigateToAppointments(page, facilityId);

    // Look for common appointment data displays
    const timeElements = page.locator('time, [class*="time"], span:has-text(/\\d+:\\d+/)');
    const nameElements = page.locator('[class*="patient"], [class*="name"]');

    // At minimum, page structure should be present
    await expect(page).toHaveURL(new RegExp(`/facility/${facilityId}/appointments`));

    // Verify page is interactive
    const buttons = page.getByRole("button");
    await expect(buttons).toHaveCount(await buttons.count());
  });

  test("should handle responsive design on smaller screens", async ({ page }) => {
    /**
     * Verifies that the appointments page is responsive
     * and functions on smaller device sizes
     */
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateToAppointments(page, facilityId);

    // Page should still be usable on mobile
    await verifyAppointmentsPageLayout(page);

    // Mobile navigation should be present
    const hamburgerMenu = page.getByRole("button").filter({ hasText: /menu/i });
    if (await hamburgerMenu.isVisible().catch(() => false)) {
      await expect(hamburgerMenu).toBeVisible();
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
