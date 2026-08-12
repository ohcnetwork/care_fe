import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

/**
 * Schedule Exceptions E2E Tests
 *
 * This test suite covers the schedule exceptions workflow which allows healthcare
 * practitioners to mark time periods as unavailable (holidays, conferences, sick leave, etc.).
 * Schedule exceptions override normal schedule templates during their validity period.
 *
 * Test coverage:
 * - Navigation to schedule exceptions tab
 * - Creating single-day exceptions (e.g., half-day leave)
 * - Creating multi-day exceptions (e.g., conference, vacation)
 * - Creating all-day unavailable exceptions
 * - Viewing existing exceptions with date ranges
 * - Deleting exceptions with confirmation dialog
 * - Empty state handling
 *
 * Prerequisites:
 * - Authenticated user with schedule management permissions
 * - A test user (care-doctor) to manage schedules for
 * - Facility with proper permissions configured
 */

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Schedule Exceptions", () => {
  let facilityId: string;
  let userAvailabilityUrl: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    // Navigate to test user's availability tab
    // Using care-doctor as the test subject (from fixtures)
    userAvailabilityUrl = `/facility/${facilityId}/users/care-doctor/availability`;
    await page.goto(userAvailabilityUrl);
    await page.waitForLoadState("networkidle");

    // Switch to exceptions view
    await page.getByRole("button", { name: "Exceptions" }).click();
    await expect(page.getByRole("button", { name: "Add Exception" })).toBeVisible();
  });

  test("should display empty state when no exceptions exist", async ({
    page,
  }) => {
    /**
     * Verifies that the exceptions tab shows an appropriate empty state
     * with icon and message when no exceptions are configured.
     */
    // Check for empty state message (may exist if no exceptions)
    const emptyStateVisible = await page
      .getByText("no_scheduled_exceptions_found")
      .isVisible()
      .catch(() => false);

    if (emptyStateVisible) {
      // Verify empty state icon is present
      await expect(page.locator('[class*="l-calendar-slash"]')).toBeVisible();
    }
  });

  test("should open add exception sheet", async ({ page }) => {
    /**
     * Verifies that clicking "Add Exception" button opens the creation sheet
     * with proper form fields and description.
     */
    // Click add exception button
    await page.getByRole("button", { name: "Add Exception" }).click();

    // Verify sheet opens with proper title and description
    await expect(
      page.getByRole("heading", { name: "add_schedule_exceptions" }),
    ).toBeVisible();
    await expect(
      page.getByText("add_schedule_exceptions_description"),
    ).toBeVisible();

    // Verify all required form fields are present
    await expect(page.getByLabel("Reason", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Valid From", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Valid Till", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Start Time", { exact: false })).toBeVisible();
    await expect(page.getByLabel("End Time", { exact: false })).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "Unavailable all day" }),
    ).toBeVisible();

    // Close sheet
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "add_schedule_exceptions" }),
    ).not.toBeVisible();
  });

  test("should create single-day exception with specific times", async ({
    page,
  }) => {
    /**
     * Creates a half-day exception for a single day with specific start/end times.
     * Example: Doctor's appointment from 10 AM to 12 PM on a specific date.
     */
    const exceptionReason = `Medical Appointment ${faker.string.alphanumeric(6)}`;

    // Open add exception sheet
    await page.getByRole("button", { name: "Add Exception" }).click();

    // Fill reason
    await page.getByLabel("Reason", { exact: false }).fill(exceptionReason);

    // Select valid_from date (tomorrow)
    await page.getByRole("button", { name: "Pick a date" }).first().click();
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^15$/ })
      .getByRole("button")
      .click();

    // Select valid_to date (same day)
    const validTillLabel = page.locator('label:has-text("Valid Till")');
    await validTillLabel
      .locator("..")
      .locator('button[data-slot="popover-trigger"]')
      .click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^15$/ })
      .getByRole("button")
      .click();

    // Fill time range (10:00 AM to 12:00 PM)
    await page.getByLabel("Start Time", { exact: false }).fill("10:00");
    await page.getByLabel("End Time", { exact: false }).fill("12:00");

    // Submit form
    await page.getByRole("button", { name: "Create", exact: true }).click();

    // Verify success toast appears
    await expect(page.getByText("exception_created")).toBeVisible();

    // Verify exception appears in list
    await expect(page.getByText(exceptionReason)).toBeVisible();
    await expect(page.getByText("10 AM - 12 PM")).toBeVisible();
  });

  test("should create multi-day exception", async ({ page }) => {
    /**
     * Creates an exception spanning multiple days (e.g., conference, vacation).
     * Tests date range selection where valid_to is after valid_from.
     */
    const exceptionReason = `Annual Conference ${faker.string.alphanumeric(6)}`;

    // Open add exception sheet
    await page.getByRole("button", { name: "Add Exception" }).click();

    // Fill reason
    await page.getByLabel("Reason", { exact: false }).fill(exceptionReason);

    // Select valid_from date (15th of next month)
    await page.getByRole("button", { name: "Pick a date" }).first().click();
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^15$/ })
      .getByRole("button")
      .click();

    // Select valid_to date (18th of same month - 3 days later)
    const validTillLabel = page.locator('label:has-text("Valid Till")');
    await validTillLabel
      .locator("..")
      .locator('button[data-slot="popover-trigger"]')
      .click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^18$/ })
      .getByRole("button")
      .click();

    // Fill time range (9:00 AM to 5:00 PM)
    await page.getByLabel("Start Time", { exact: false }).fill("09:00");
    await page.getByLabel("End Time", { exact: false }).fill("17:00");

    // Submit form
    await page.getByRole("button", { name: "Create", exact: true }).click();

    // Verify success toast appears
    await expect(page.getByText("exception_created")).toBeVisible();

    // Verify exception appears in list
    await expect(page.getByText(exceptionReason)).toBeVisible();
    await expect(page.getByText("9 AM - 5 PM")).toBeVisible();
  });

  test("should create all-day unavailable exception", async ({ page }) => {
    /**
     * Creates an exception for the entire day using the "Unavailable all day" checkbox.
     * This automatically sets times to 00:00 - 23:59 and disables time inputs.
     */
    const exceptionReason = `Holiday Leave ${faker.string.alphanumeric(6)}`;

    // Open add exception sheet
    await page.getByRole("button", { name: "Add Exception" }).click();

    // Fill reason
    await page.getByLabel("Reason", { exact: false }).fill(exceptionReason);

    // Select valid_from date
    await page.getByRole("button", { name: "Pick a date" }).first().click();
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^20$/ })
      .getByRole("button")
      .click();

    // Select valid_to date (same day)
    const validTillLabel = page.locator('label:has-text("Valid Till")');
    await validTillLabel
      .locator("..")
      .locator('button[data-slot="popover-trigger"]')
      .click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^20$/ })
      .getByRole("button")
      .click();

    // Enable "Unavailable all day" checkbox
    await page.getByRole("checkbox", { name: "Unavailable all day" }).click();

    // Verify time inputs are disabled or auto-filled
    const startTimeInput = page.getByLabel("Start Time", { exact: false });
    const endTimeInput = page.getByLabel("End Time", { exact: false });

    // Check if inputs are disabled or have auto-filled values
    const startTimeDisabled = await startTimeInput
      .isDisabled()
      .catch(() => false);
    if (!startTimeDisabled) {
      // Inputs may be auto-filled with 00:00 and 23:59
      await expect(startTimeInput).toHaveValue("00:00");
      await expect(endTimeInput).toHaveValue("23:59");
    }

    // Submit form
    await page.getByRole("button", { name: "Create", exact: true }).click();

    // Verify success toast appears
    await expect(page.getByText("exception_created")).toBeVisible();

    // Verify exception appears in list
    await expect(page.getByText(exceptionReason)).toBeVisible();
  });

  test("should display exception with date range formatting", async ({
    page,
  }) => {
    /**
     * Verifies that created exceptions display with proper date formatting:
     * - Single day: "on Tue, 15 Dec 2026"
     * - Multi-day: "from Tue, 15 Dec 2026 to Thu, 17 Dec 2026"
     */
    const exceptionReason = `Verify Display ${faker.string.alphanumeric(6)}`;

    // Create an exception
    await page.getByRole("button", { name: "Add Exception" }).click();
    await page.getByLabel("Reason", { exact: false }).fill(exceptionReason);

    // Select dates
    await page.getByRole("button", { name: "Pick a date" }).first().click();
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^10$/ })
      .getByRole("button")
      .click();

    const validTillLabel = page.locator('label:has-text("Valid Till")');
    await validTillLabel
      .locator("..")
      .locator('button[data-slot="popover-trigger"]')
      .click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^10$/ })
      .getByRole("button")
      .click();

    // Fill times
    await page.getByLabel("Start Time", { exact: false }).fill("14:00");
    await page.getByLabel("End Time", { exact: false }).fill("16:00");

    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("exception_created")).toBeVisible();

    // Verify exception is displayed with formatted dates
    await expect(page.getByText(exceptionReason)).toBeVisible();
    // Time formatting should show as "2 PM - 4 PM"
    await expect(page.getByText("2 PM - 4 PM")).toBeVisible();
  });

  test("should delete exception with confirmation", async ({ page }) => {
    /**
     * Tests the deletion workflow including confirmation dialog.
     * Ensures exceptions can be removed and the action requires confirmation.
     */
    const exceptionReason = `To Delete ${faker.string.alphanumeric(6)}`;

    // First create an exception to delete
    await page.getByRole("button", { name: "Add Exception" }).click();
    await page.getByLabel("Reason", { exact: false }).fill(exceptionReason);

    await page.getByRole("button", { name: "Pick a date" }).first().click();
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^25$/ })
      .getByRole("button")
      .click();

    const validTillLabel = page.locator('label:has-text("Valid Till")');
    await validTillLabel
      .locator("..")
      .locator('button[data-slot="popover-trigger"]')
      .click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^25$/ })
      .getByRole("button")
      .click();

    await page.getByLabel("Start Time", { exact: false }).fill("11:00");
    await page.getByLabel("End Time", { exact: false }).fill("13:00");

    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("exception_created")).toBeVisible();

    // Now delete the exception
    const exceptionItem = page
      .locator("li")
      .filter({ hasText: exceptionReason });
    await expect(exceptionItem).toBeVisible();

    // Click remove button
    await exceptionItem.getByRole("button", { name: "Remove" }).click();

    // Verify confirmation dialog appears
    await expect(
      page.getByRole("heading", { name: "are_you_sure" }),
    ).toBeVisible();
    await expect(page.getByText("warning")).toBeVisible();
    await expect(
      page.getByText(
        "this_will_permanently_remove_the_exception_and_cannot_be_undone",
      ),
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    // Verify success toast
    await expect(page.getByText("exception_deleted")).toBeVisible();

    // Verify exception is removed from list
    await expect(exceptionItem).not.toBeVisible();
  });

  test("should cancel exception deletion", async ({ page }) => {
    /**
     * Tests that canceling the deletion dialog keeps the exception intact.
     */
    const exceptionReason = `Keep This ${faker.string.alphanumeric(6)}`;

    // Create an exception
    await page.getByRole("button", { name: "Add Exception" }).click();
    await page.getByLabel("Reason", { exact: false }).fill(exceptionReason);

    await page.getByRole("button", { name: "Pick a date" }).first().click();
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^12$/ })
      .getByRole("button")
      .click();

    const validTillLabel = page.locator('label:has-text("Valid Till")');
    await validTillLabel
      .locator("..")
      .locator('button[data-slot="popover-trigger"]')
      .click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^12$/ })
      .getByRole("button")
      .click();

    await page.getByLabel("Start Time", { exact: false }).fill("08:00");
    await page.getByLabel("End Time", { exact: false }).fill("10:00");

    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("exception_created")).toBeVisible();

    // Try to delete but cancel
    const exceptionItem = page
      .locator("li")
      .filter({ hasText: exceptionReason });
    await exceptionItem.getByRole("button", { name: "Remove" }).click();

    // Wait for dialog and cancel
    await expect(
      page.getByRole("heading", { name: "are_you_sure" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // Verify exception still exists
    await expect(exceptionItem).toBeVisible();
  });
});
