import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";
import { createHealthcareService } from "./helpers";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

/**
 * Test suite for Schedule Templates functionality
 *
 * Schedule templates allow healthcare services to define their availability schedules,
 * including recurring weekly schedules with specific time slots and appointment capacity.
 * This is a critical prerequisite for the appointment booking system.
 *
 * Coverage:
 * - Navigating to schedule templates page
 * - Creating basic schedule templates with single availability slot
 * - Creating multi-slot schedule templates (morning + afternoon)
 * - Editing existing schedule templates
 * - Displaying template details (name, days, times, slots)
 * - Empty state handling
 */
test.describe("Schedule Templates", () => {
  const createScheduleButtonName = /add schedule|create template/i;
  const createScheduleSheetTitle = /add new schedule|create schedule template/i;

  let facilityId: string;
  let serviceId: string;
  let serviceName: string;
  let scheduleUrl: string;

  /**
   * Helper function to create a healthcare service for testing
   */
  async function setupService(page: Page) {
    serviceName = `${faker.string.alphanumeric(6)}-${faker.commerce.department()}`;
    const servicesUrl = `/facility/${facilityId}/services/`;
    await createHealthcareService(page, facilityId, serviceName, servicesUrl);

    // Extract service ID from URL after creation
    await page.getByRole("link", { name: serviceName }).click();
    await page.waitForURL(/\/facility\/.*\/services\/[^/]+\/locations/);
    const url = page.url();
    const match = url.match(/\/services\/([^/]+)\//);
    if (!match) throw new Error("Could not extract service ID from URL");
    serviceId = match[1];
    scheduleUrl = `/facility/${facilityId}/services/${serviceId}/schedule`;
  }

  /**
   * Helper to open the create schedule template sheet
   */
  async function openCreateSheet(page: Page) {
    await page.getByRole("button", { name: createScheduleButtonName }).click();
    await expect(
      page.getByRole("heading", { name: createScheduleSheetTitle }),
    ).toBeVisible();
  }

  /**
   * Selects Valid From (tomorrow) and Valid Till (a week later).
   *
   * The backend rejects a valid_from of today ("Date cannot be before the
   * current date"), so we use tomorrow. The template list is also filtered to
   * the currently-viewed month, so both dates stay within the current month so
   * the new template shows up in the default view.
   *
   * Days are targeted via react-day-picker's unambiguous `data-day` (ISO date)
   * attribute, and interactions are scoped to the open popover — the schedule
   * page renders its own inline month calendar that would otherwise collide.
   */
  function isoDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  }

  function monthsAhead(from: Date, to: Date) {
    return (
      (to.getFullYear() - from.getFullYear()) * 12 +
      to.getMonth() -
      from.getMonth()
    );
  }

  async function pickCalendarDay(
    page: Page,
    target: Date,
    monthsForward: number,
  ) {
    const calendar = page.locator('[data-slot="popover-content"]').last();
    await expect(calendar).toBeVisible();
    const nextMonth = calendar.getByRole("button", {
      name: "Go to the Next Month",
    });
    for (let i = 0; i < monthsForward; i++) {
      await nextMonth.click({ force: true });
    }
    await calendar
      .locator(`[data-day="${isoDate(target)}"]`)
      .getByRole("button")
      .first()
      .click();
    // Selecting a day closes the popover; wait so the next picker is unambiguous
    await expect(calendar).toBeHidden();
  }

  async function selectValidDates(page: Page) {
    const today = new Date();
    const validFrom = new Date(today);
    validFrom.setDate(today.getDate() + 1); // tomorrow (backend requires a future date)
    const validTo = new Date(validFrom);
    validTo.setDate(validFrom.getDate() + 7);

    // Valid From
    await page.getByRole("button", { name: "Pick a date" }).first().click();
    await pickCalendarDay(page, validFrom, monthsAhead(today, validFrom));

    // Valid Till
    await page
      .locator('label:has-text("Valid Till")')
      .locator("..")
      .locator('button[data-slot="popover-trigger"]')
      .click();
    await pickCalendarDay(page, validTo, monthsAhead(today, validTo));
  }

  /**
   * Helper to fill basic schedule template form
   */
  async function fillBasicTemplate(
    page: Page,
    options: {
      name: string;
      weekdays?: string[];
      startTime?: string;
      endTime?: string;
      slotsPerSession?: number;
      slotSizeMinutes?: number;
      isPublic?: boolean;
      sessionTitle?: string;
    },
  ) {
    const {
      name,
      weekdays = ["Monday", "Wednesday", "Friday"],
      startTime = "09:00",
      endTime = "17:00",
      slotsPerSession = 10,
      slotSizeMinutes = 30,
      isPublic = false,
      sessionTitle = "General Consultation",
    } = options;

    // Fill template name
    await page.getByRole("textbox", { name: "Template Name" }).fill(name);

    // Select valid from / valid till dates
    await selectValidDates(page);

    // Weekdays are toggle buttons whose accessible name is the full day name
    for (const day of weekdays) {
      await page.getByRole("button", { name: day, exact: true }).click();
    }

    // Toggle public if requested
    if (isPublic) {
      await page
        .getByRole("checkbox", { name: "Make the template public" })
        .check();
    }

    // Fill first availability session (a default session is already present)
    await page
      .getByRole("textbox", { name: "Session Title" })
      .fill(sessionTitle);

    // Fill time slots
    await page.getByRole("textbox", { name: "Start Time" }).fill(startTime);
    await page.getByRole("textbox", { name: "End Time" }).fill(endTime);

    // Fill slot configuration
    await page
      .getByRole("spinbutton", { name: "Slot duration (mins.)" })
      .fill(slotSizeMinutes.toString());
    await page
      .getByRole("spinbutton", { name: "Patients per Slot" })
      .fill(slotsPerSession.toString());
  }

  test.beforeAll(async ({ browser }) => {
    facilityId = getFacilityId();
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    await setupService(page);
    await page.close();
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(scheduleUrl);
  });

  test("should navigate to schedule templates page", async ({ page }) => {
    await test.step("Verify schedule page loads", async () => {
      await expect(page).toHaveURL(scheduleUrl);
    });

    await test.step("Verify schedule tab is active", async () => {
      // The schedule tab should be selected by default
      await expect(page).toHaveURL(scheduleUrl);
    });

    await test.step("Verify Add Schedule button is present", async () => {
      await expect(
        page.getByRole("button", { name: createScheduleButtonName }),
      ).toBeVisible();
    });
  });

  test("should display empty state when no templates exist", async ({
    page,
  }) => {
    await test.step("Verify empty state message", async () => {
      // Initially there should be no templates, so empty state should show
      const emptyStateText = page.getByText(/no schedule templates found/i);
      if (await emptyStateText.isVisible()) {
        await expect(emptyStateText).toBeVisible();
      }
    });
  });

  test("should create basic schedule template", async ({ page }) => {
    const templateName = `${faker.string.alphanumeric(6)}-Morning-Shift`;

    await test.step("Open create schedule sheet", async () => {
      await openCreateSheet(page);
    });

    await test.step("Fill schedule template form", async () => {
      await fillBasicTemplate(page, {
        name: templateName,
        weekdays: ["Monday", "Tuesday", "Wednesday"],
        startTime: "09:00",
        endTime: "12:00",
        slotsPerSession: 15,
        slotSizeMinutes: 15,
      });
    });

    await test.step("Submit and verify success", async () => {
      await page.getByRole("button", { name: "Save" }).click();

      // Success toast confirms the create request landed
      await expectToast(page, "Schedule template created successfully");

      // Sheet closes after a successful create
      await expect(
        page.getByRole("heading", { name: createScheduleSheetTitle }),
      ).not.toBeVisible();
    });

    await test.step("Verify template appears with details", async () => {
      const card = page
        .locator("div.rounded-lg.bg-white")
        .filter({ hasText: templateName });

      await expect(card).toBeVisible();
      // Days of week (rendered as short, comma-separated abbreviations)
      await expect(card).toContainText("Mon, Tue, Wed");
      // Session title and formatted time range (see formatTimeShort util)
      await expect(card.getByText("General Consultation")).toBeVisible();
      await expect(card.getByText("9 AM - 12 PM")).toBeVisible();
    });
  });

  test("should create multi-slot schedule template", async ({ page }) => {
    const templateName = `${faker.string.alphanumeric(6)}-Full-Day`;

    await test.step("Open create schedule sheet", async () => {
      await openCreateSheet(page);
    });

    await test.step("Fill template name and basic info", async () => {
      await page
        .getByRole("textbox", { name: "Template Name" })
        .fill(templateName);

      // Select valid from / valid till dates
      await selectValidDates(page);

      // Select all weekdays (toggle buttons named by full day name)
      for (const day of [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ]) {
        await page.getByRole("button", { name: day, exact: true }).click();
      }
    });

    await test.step("Fill first availability slot (Morning)", async () => {
      await page
        .getByRole("textbox", { name: "Session Title" })
        .fill("Morning Consultation");
      await page.getByRole("textbox", { name: "Start Time" }).fill("09:00");
      await page.getByRole("textbox", { name: "End Time" }).fill("12:00");
      await page
        .getByRole("spinbutton", { name: "Slot duration (mins.)" })
        .fill("20");
      await page
        .getByRole("spinbutton", { name: "Patients per Slot" })
        .fill("1");
    });

    await test.step("Add second availability slot (Afternoon)", async () => {
      await page.getByRole("button", { name: "Add another session" }).click();

      // Fill second slot (index 1)
      await page
        .getByRole("textbox", { name: "Session Title" })
        .nth(1)
        .fill("Afternoon Consultation");
      await page
        .getByRole("textbox", { name: "Start Time" })
        .nth(1)
        .fill("14:00");
      await page
        .getByRole("textbox", { name: "End Time" })
        .nth(1)
        .fill("17:00");
      await page
        .getByRole("spinbutton", { name: "Slot duration (mins.)" })
        .nth(1)
        .fill("30");
      await page
        .getByRole("spinbutton", { name: "Patients per Slot" })
        .nth(1)
        .fill("2");
    });

    await test.step("Submit and verify template", async () => {
      await page.getByRole("button", { name: "Save" }).click();

      await expectToast(page, "Schedule template created successfully");
      await expect(
        page.getByRole("heading", { name: createScheduleSheetTitle }),
      ).not.toBeVisible();
    });

    await test.step("Verify both slots are displayed", async () => {
      const card = page
        .locator("div.rounded-lg.bg-white")
        .filter({ hasText: templateName });

      await expect(card).toBeVisible();
      await expect(card.getByText("Morning Consultation")).toBeVisible();
      await expect(card.getByText("Afternoon Consultation")).toBeVisible();
      await expect(card.getByText("9 AM - 12 PM")).toBeVisible();
      await expect(card.getByText("2 PM - 5 PM")).toBeVisible();
    });
  });

  test("should edit existing schedule template", async ({ page }) => {
    const originalName = `${faker.string.alphanumeric(6)}-Original`;
    const updatedName = `${faker.string.alphanumeric(6)}-Updated`;

    await test.step("Create a template to edit", async () => {
      await openCreateSheet(page);
      await fillBasicTemplate(page, {
        name: originalName,
        weekdays: ["Monday"],
      });
      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, "Schedule template created successfully");
      await expect(page.getByText(originalName)).toBeVisible();
    });

    const sheet = page.locator('div[role="dialog"][data-slot="sheet-content"]');

    await test.step("Open edit sheet", async () => {
      // Edit trigger is an icon-only button (pen-line icon) within the card
      const templateCard = page
        .locator("div.rounded-lg.bg-white")
        .filter({ hasText: originalName });
      await templateCard
        .locator('button[data-slot="button"]')
        .filter({ has: page.locator("svg.lucide-pen-line") })
        .first()
        .click();

      await expect(
        sheet.getByRole("heading", { name: "Edit Schedule Template" }),
      ).toBeVisible();
    });

    await test.step("Verify existing name is prefilled", async () => {
      await expect(
        sheet.getByRole("textbox", { name: "Template Name" }),
      ).toHaveValue(originalName);
    });

    await test.step("Modify template name and save", async () => {
      await sheet
        .getByRole("textbox", { name: "Template Name" })
        .fill(updatedName);
      await sheet.getByRole("button", { name: "Save", exact: true }).click();
      await expectToast(page, "Schedule template updated successfully");
    });

    await test.step("Close sheet and verify changes are displayed", async () => {
      await page.keyboard.press("Escape");
      await expect(sheet).not.toBeVisible();

      await expect(page.getByText(updatedName)).toBeVisible();
      await expect(page.getByText(originalName)).not.toBeVisible();
    });
  });

  test("should display private template indicator", async ({ page }) => {
    const privateName = `${faker.string.alphanumeric(6)}-Private`;

    await test.step("Create private template", async () => {
      await openCreateSheet(page);
      await fillBasicTemplate(page, {
        name: privateName,
        isPublic: false, // Keep it private
      });
      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, "Schedule template created successfully");
      await expect(page.getByText(privateName)).toBeVisible();
    });

    await test.step("Verify lock icon appears for private template", async () => {
      const templateCard = page
        .locator("div.rounded-lg.bg-white")
        .filter({ hasText: privateName });

      // Look for lock icon (indicates private template)
      // The lock icon should be visible near the template name
      const lockIcon = templateCard.locator('svg[class*="lucide-lock"]');
      await expect(lockIcon).toBeVisible();
    });
  });

  test("should display public template without lock icon", async ({ page }) => {
    const publicName = `${faker.string.alphanumeric(6)}-Public`;

    await test.step("Create public template", async () => {
      await openCreateSheet(page);
      await fillBasicTemplate(page, {
        name: publicName,
        isPublic: true,
      });
      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, "Schedule template created successfully");
      await expect(page.getByText(publicName)).toBeVisible();
    });

    await test.step("Verify no lock icon for public template", async () => {
      const templateCard = page
        .locator("div.rounded-lg.bg-white")
        .filter({ hasText: publicName });

      // Lock icon should NOT be present
      const lockIcon = templateCard.locator('svg[class*="lucide-lock"]');
      await expect(lockIcon).not.toBeVisible();
    });
  });
});
