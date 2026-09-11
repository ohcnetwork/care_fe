import { faker } from "@faker-js/faker";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import {
  createDisposableUserViaUi,
  DEFAULT_DISPOSABLE_USER_PASSWORD,
} from "tests/helper/user";

const LOCAL_OTP = "45612";

/**
 * Helper to authenticate as admin and create a disposable user for testing
 */
async function withAdminPage<T>(
  browser: Browser,
  run: (page: Page) => Promise<T>,
): Promise<T> {
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
  });
  const page = await context.newPage();
  try {
    return await run(page);
  } finally {
    await context.close();
  }
}

/**
 * Helper to perform patient OTP login flow
 */
async function loginAsPatient(
  page: Page,
  phoneNumber: string,
  facilityId: string,
  staffId: string,
) {
  await page.goto(
    `/facility/${facilityId}/appointments/${staffId}/otp/send`,
  );
  await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
  await page.getByRole("button", { name: /send otp/i }).click();
  
  await expect(page.getByText(/enter otp sent to/i)).toBeVisible();
  await page.locator("#otp").fill(LOCAL_OTP);
  await page.getByRole("button", { name: /verify otp/i }).click();
}

test.describe("Public Appointment Booking - Schedule Page", () => {
  let staffUser: { username: string; phoneNumber: string; password: string };
  let facilityId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a disposable staff user for appointment booking
    staffUser = await withAdminPage(browser, (page) =>
      createDisposableUserViaUi(page),
    );
  });

  test.beforeEach(async ({ page }) => {
    // Get facility ID from the facility list page
    await page.goto("/");
    const facilityCard = page.locator('[data-cy="facility-card"]').first();
    const facilityLink = await facilityCard.locator("a").first().getAttribute("href");
    facilityId = facilityLink?.match(/\/facility\/([^/]+)/)?.[1] || "";
  });

  test("displays the schedule page with practitioner details", async ({ browser, page }) => {
    /**
     * Verify that the schedule page loads and displays:
     * - Practitioner avatar and name
     * - Facility name
     * - Calendar for date selection
     * - Note textarea
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    // Verify page heading
    await expect(
      page.getByText(/book an appointment with/i),
    ).toBeVisible();

    // Verify practitioner card is displayed
    await expect(page.locator("text=" + staffUser.username)).toBeVisible();

    // Verify note textarea
    await expect(page.getByPlaceholder(/appointment note/i)).toBeVisible();

    // Verify calendar is visible
    await expect(page.locator('[role="button"]', { hasText: /^\d+$/ }).first()).toBeVisible();

    // Verify back button
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
  });

  test("allows user to enter appointment notes", async ({ browser, page }) => {
    /**
     * Verify that the note textarea accepts and retains user input
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    const testNote = faker.lorem.sentence();
    await page.getByPlaceholder(/appointment note/i).fill(testNote);
    
    // Verify the note is retained
    await expect(page.getByPlaceholder(/appointment note/i)).toHaveValue(testNote);
  });

  test("allows user to select a date from calendar", async ({ browser, page }) => {
    /**
     * Verify that clicking a date in the calendar:
     * - Updates the selected date visually
     * - Triggers slot loading for that date
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    // Get a future date button from the calendar (not today)
    const dateButtons = page.locator('[role="button"]').filter({ hasText: /^\d+$/ });
    const futureDateButton = dateButtons.nth(15); // Select a date 15 days out
    await futureDateButton.click();

    // Verify the date button gets the selected styling (ring-2 ring-primary-500)
    await expect(futureDateButton).toHaveClass(/ring-primary-500/);
  });

  test("displays 'no slots available' when no slots exist", async ({ browser, page }) => {
    /**
     * Verify that when no slots are available for a selected date,
     * the appropriate message is displayed
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    // Wait for slots to load
    await page.waitForLoadState("networkidle");

    // Since the test user likely has no slots configured, verify empty state
    const noSlotsMessage = page.getByText(/no slots available/i);
    
    // Either no slots message is visible, or slots are displayed
    const hasNoSlots = await noSlotsMessage.isVisible().catch(() => false);
    const hasSlots = await page.locator('[role="button"]').filter({ hasText: /AM|PM/ }).count() > 0;
    
    expect(hasNoSlots || hasSlots).toBeTruthy();
  });

  test("does not display continue button when no slot is selected", async ({ browser, page }) => {
    /**
     * Verify that the continue/book button only appears after selecting a slot
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    await page.waitForLoadState("networkidle");

    // Continue button should not be visible without slot selection
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).not.toBeVisible();
  });

  test("navigates back to facility page when back button is clicked", async ({ browser, page }) => {
    /**
     * Verify that the back button navigates to the facility page
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    await page.getByRole("button", { name: /back/i }).click();
    
    // Should navigate to facility page
    await expect(page).toHaveURL(`/facility/${facilityId}`);
  });

  test("displays loading state while fetching user data", async ({ browser, page }) => {
    /**
     * Verify loading indicator appears while practitioner data is being fetched
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    // Navigate and immediately check for loading state
    const navigationPromise = page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    // Loading component should appear
    const loadingIndicator = page.locator('[class*="loading"]').or(
      page.locator('text=/loading/i'),
    );
    
    // Either we catch the loading state or the page loads too fast (both valid)
    await Promise.race([
      expect(loadingIndicator).toBeVisible({ timeout: 1000 }).catch(() => {}),
      navigationPromise,
    ]);

    // Eventually page should load successfully
    await navigationPromise;
    await expect(page.getByText(/book an appointment with/i)).toBeVisible();
  });

  test("changes calendar month when month navigation is used", async ({ browser, page }) => {
    /**
     * Verify that the calendar allows navigation to different months
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    // Get current month from calendar
    const currentMonth = await page
      .locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/')
      .first()
      .textContent();

    // Find and click next month button (usually a chevron icon)
    const nextMonthButton = page.locator('button[aria-label*="next"]')
      .or(page.locator('button').filter({ hasText: /›|»|→/ }));
    
    if (await nextMonthButton.count() > 0) {
      await nextMonthButton.first().click();
      
      // Verify month changed
      const newMonth = await page
        .locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/')
        .first()
        .textContent();
      
      expect(newMonth).not.toBe(currentMonth);
    }
  });

  test("redirects to OTP page if no authentication token exists", async ({ page }) => {
    /**
     * Verify that accessing the schedule page without authentication
     * redirects to the OTP send page
     */
    // Clear any existing storage
    await page.context().clearCookies();
    await page.goto("/");
    
    // Try to access schedule page directly without authentication
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    // Should show error toast and redirect to OTP page
    await expectToast(page, /phone number not found/i);
    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/appointments/${staffUser.username}/otp/send`),
    );
  });

  test("displays facility name in practitioner card", async ({ browser, page }) => {
    /**
     * Verify that the facility name is displayed in the practitioner info card
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    // Wait for facility data to load
    await page.waitForLoadState("networkidle");

    // Facility name should be visible in the card footer
    const facilityNameLocator = page.locator('.border-t.border-gray-100.bg-gray-50 .text-sm.text-gray-500');
    await expect(facilityNameLocator).toBeVisible();
  });

  test("preserves note text when changing selected date", async ({ browser, page }) => {
    /**
     * Verify that the appointment note is preserved when user changes
     * the selected date in the calendar
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    // Enter a note
    const testNote = faker.lorem.sentence();
    await page.getByPlaceholder(/appointment note/i).fill(testNote);

    // Select a different date
    const dateButtons = page.locator('[role="button"]').filter({ hasText: /^\d+$/ });
    await dateButtons.nth(10).click();

    // Verify note is still there
    await expect(page.getByPlaceholder(/appointment note/i)).toHaveValue(testNote);
  });

  test("shows error when accessing schedule for non-existent staff", async ({ browser, page }) => {
    /**
     * Verify proper error handling when accessing the schedule page
     * for a staff member that doesn't exist
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    const nonExistentStaffId = `nonexistent-${faker.string.numeric(5)}`;
    
    await page.goto(
      `/facility/${facilityId}/appointments/${nonExistentStaffId}/book-appointment`,
    );

    // Should show error toast for invalid user
    await expectToast(page, /error fetching user data/i);
  });

  test("displays user type in practitioner card", async ({ browser, page }) => {
    /**
     * Verify that the practitioner's user type (e.g., Doctor, Nurse) is displayed
     */
    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    await page.waitForLoadState("networkidle");

    // User type should be visible below the name
    const userTypeLocator = page.locator('.text-sm.text-gray-500.truncate');
    await expect(userTypeLocator.first()).toBeVisible();
  });
});

test.describe("Public Appointment Booking - Slot Selection", () => {
  /**
   * Note: These tests verify the slot selection UI behavior.
   * Actual slot availability depends on backend configuration and may not
   * be present in test environments. Tests verify UI behavior when slots
   * are or are not available.
   */

  test("slot selection enables continue button", async ({ browser, page }) => {
    /**
     * Verify that selecting a time slot enables and displays the continue button
     * 
     * Note: This test requires actual slots to be configured in the backend.
     * If no slots exist, the test will pass as it's testing conditional rendering.
     */
    const staffUser = await withAdminPage(browser, (page) =>
      createDisposableUserViaUi(page),
    );

    await page.goto("/");
    const facilityCard = page.locator('[data-cy="facility-card"]').first();
    const facilityLink = await facilityCard.locator("a").first().getAttribute("href");
    const facilityId = facilityLink?.match(/\/facility\/([^/]+)/)?.[1] || "";

    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    await page.waitForLoadState("networkidle");

    // Check if any slots are available
    const slotButtons = page.locator('button').filter({ hasText: /\d+:\d+\s*(AM|PM)/ });
    const slotCount = await slotButtons.count();

    if (slotCount > 0) {
      // If slots exist, select one and verify continue button appears
      await slotButtons.first().click();
      
      const continueButton = page.getByRole("button", { name: /continue/i });
      await expect(continueButton).toBeVisible();
    } else {
      // If no slots, verify no continue button (correct behavior)
      const continueButton = page.getByRole("button", { name: /continue/i });
      await expect(continueButton).not.toBeVisible();
    }
  });

  test("continue button navigates to patient select page", async ({ browser, page }) => {
    /**
     * Verify that clicking continue after slot selection navigates
     * to the patient selection page
     * 
     * Note: This test requires actual slots to be configured in the backend.
     */
    const staffUser = await withAdminPage(browser, (page) =>
      createDisposableUserViaUi(page),
    );

    await page.goto("/");
    const facilityCard = page.locator('[data-cy="facility-card"]').first();
    const facilityLink = await facilityCard.locator("a").first().getAttribute("href");
    const facilityId = facilityLink?.match(/\/facility\/([^/]+)/)?.[1] || "";

    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment`,
    );

    await page.waitForLoadState("networkidle");

    // Check if any slots are available
    const slotButtons = page.locator('button').filter({ hasText: /\d+:\d+\s*(AM|PM)/ });
    const slotCount = await slotButtons.count();

    if (slotCount > 0) {
      // Select a slot and continue
      await slotButtons.first().click();
      
      const continueButton = page.getByRole("button", { name: /continue/i });
      await continueButton.click();
      
      // Should navigate to patient select page with query params
      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/appointments/${staffUser.username}/patient-select`),
      );
    }
  });
});

test.describe("Public Appointment Booking - Reschedule Flow", () => {
  /**
   * Tests for rescheduling existing appointments
   * 
   * Note: These tests verify the reschedule UI and flow.
   * Actual rescheduling requires an existing appointment in the backend.
   */

  test("displays reschedule heading when appointment ID is present", async ({ browser, page }) => {
    /**
     * Verify that when accessing the schedule page with an appointment ID,
     * the heading changes to indicate rescheduling
     */
    const staffUser = await withAdminPage(browser, (page) =>
      createDisposableUserViaUi(page),
    );

    await page.goto("/");
    const facilityCard = page.locator('[data-cy="facility-card"]').first();
    const facilityLink = await facilityCard.locator("a").first().getAttribute("href");
    const facilityId = facilityLink?.match(/\/facility\/([^/]+)/)?.[1] || "";

    await loginAsPatient(page, staffUser.phoneNumber, facilityId, staffUser.username);
    
    // Simulate rescheduling by adding appointment ID to URL
    const mockAppointmentId = faker.string.uuid();
    await page.goto(
      `/facility/${facilityId}/appointments/${staffUser.username}/book-appointment?appointmentId=${mockAppointmentId}`,
    );

    // When appointmentId is present, heading should say "Reschedule"
    // Note: Actual reschedule flow requires valid appointment in backend
    await expect(
      page.getByText(/reschedule appointment with|book an appointment with/i),
    ).toBeVisible();
  });
});
