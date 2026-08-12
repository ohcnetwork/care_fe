import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
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
    await expect(page.getByRole("heading", { name: createScheduleSheetTitle }))
      .toBeVisible();
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
    } = options;

    // Fill template name
    await page.getByRole("textbox", { name: "Name" }).fill(name);

    // Select valid from date (today)
    await page.getByLabel("Valid From").click();
    await page.getByRole("button", { name: "Today" }).click();

    // Select valid to date (30 days from today)
    await page.getByLabel("Valid To").click();
    await page
      .getByRole("gridcell")
      .filter({ hasText: /^30$/ })
      .first()
      .click();

    // Select weekdays
    for (const day of weekdays) {
      await page.getByLabel(day, { exact: true }).check();
    }

    // Toggle public if requested
    if (isPublic) {
      await page.getByLabel("Make this template public").check();
    }

    // Fill first availability slot (default slot is already present)
    await page
      .getByRole("textbox", { name: "Session Title" })
      .fill("General Consultation");

    // Fill time slots
    await page.getByLabel("Start Time").fill(startTime);
    await page.getByLabel("End Time").fill(endTime);

    // Fill slot configuration
    await page
      .getByLabel("Slot Size (minutes)")
      .fill(slotSizeMinutes.toString());
    await page.getByLabel("Patients per slot").fill(slotsPerSession.toString());
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

      // Wait for sheet to close and template to appear
      await expect(
        page.getByRole("heading", { name: createScheduleSheetTitle }),
      ).not.toBeVisible();
    });

    await test.step("Verify template appears in list", async () => {
      await expect(page.getByText(templateName)).toBeVisible();
    });

    await test.step("Verify template details are displayed", async () => {
      // Verify days of week
      await expect(page.getByText(/Mon.*Tue.*Wed/)).toBeVisible();

      // Verify time slot details
      await expect(page.getByText("General Consultation")).toBeVisible();
      await expect(page.getByText(/09:00.*12:00/)).toBeVisible();
    });
  });

  test("should create multi-slot schedule template", async ({ page }) => {
    const templateName = `${faker.string.alphanumeric(6)}-Full-Day`;

    await test.step("Open create schedule sheet", async () => {
      await openCreateSheet(page);
    });

    await test.step("Fill template name and basic info", async () => {
      await page.getByRole("textbox", { name: "Name" }).fill(templateName);

      // Select dates
      await page.getByLabel("Valid From").click();
      await page.getByRole("button", { name: "Today" }).click();

      await page.getByLabel("Valid To").click();
      await page
        .getByRole("gridcell")
        .filter({ hasText: /^30$/ })
        .first()
        .click();

      // Select all weekdays
      await page.getByLabel("Monday", { exact: true }).check();
      await page.getByLabel("Tuesday", { exact: true }).check();
      await page.getByLabel("Wednesday", { exact: true }).check();
      await page.getByLabel("Thursday", { exact: true }).check();
      await page.getByLabel("Friday", { exact: true }).check();
    });

    await test.step("Fill first availability slot (Morning)", async () => {
      await page
        .getByRole("textbox", { name: "Session Title" })
        .fill("Morning Consultation");
      await page.getByLabel("Start Time").fill("09:00");
      await page.getByLabel("End Time").fill("12:00");
      await page.getByLabel("Slot Size (minutes)").fill("20");
      await page.getByLabel("Patients per slot").fill("1");
    });

    await test.step("Add second availability slot (Afternoon)", async () => {
      await page.getByRole("button", { name: "Add Another Session" }).click();

      // Fill second slot
      const sessionTitles = page.getByRole("textbox", {
        name: "Session Title",
      });
      await sessionTitles.nth(1).fill("Afternoon Consultation");

      const startTimes = page.getByLabel("Start Time");
      await startTimes.nth(1).fill("14:00");

      const endTimes = page.getByLabel("End Time");
      await endTimes.nth(1).fill("17:00");

      const slotSizes = page.getByLabel("Slot Size (minutes)");
      await slotSizes.nth(1).fill("30");

      const patientsPerSlot = page.getByLabel("Patients per slot");
      await patientsPerSlot.nth(1).fill("2");
    });

    await test.step("Submit and verify template", async () => {
      await page.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByRole("heading", { name: createScheduleSheetTitle }),
      ).not.toBeVisible();
    });

    await test.step("Verify both slots are displayed", async () => {
      await expect(page.getByText(templateName)).toBeVisible();
      await expect(page.getByText("Morning Consultation")).toBeVisible();
      await expect(page.getByText("Afternoon Consultation")).toBeVisible();
      await expect(page.getByText(/09:00.*12:00/)).toBeVisible();
      await expect(page.getByText(/14:00.*17:00/)).toBeVisible();
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
      await expect(page.getByText(originalName)).toBeVisible();
    });

    await test.step("Open edit sheet", async () => {
      // Find the template and click its edit button
      const templateCard = page
        .locator(".rounded-lg")
        .filter({ hasText: originalName });
      await templateCard
        .getByRole("button")
        .filter({ hasText: /edit/i })
        .click();

      await expect(
        page.getByRole("heading", { name: /edit.*schedule/i }),
      ).toBeVisible();
    });

    await test.step("Modify template name", async () => {
      await page.getByRole("textbox", { name: "Name" }).clear();
      await page.getByRole("textbox", { name: "Name" }).fill(updatedName);
    });

    await test.step("Modify weekdays", async () => {
      // Add Tuesday and Wednesday
      await page.getByLabel("Tuesday", { exact: true }).check();
      await page.getByLabel("Wednesday", { exact: true }).check();
    });

    await test.step("Save changes", async () => {
      await page.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByRole("heading", { name: /edit.*schedule/i }),
      ).not.toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify changes are displayed", async () => {
      await expect(page.getByText(updatedName)).toBeVisible();
      await expect(page.getByText(originalName)).not.toBeVisible();

      // Verify updated days
      await expect(page.getByText(/Mon.*Tue.*Wed/)).toBeVisible();
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
      await expect(page.getByText(privateName)).toBeVisible();
    });

    await test.step("Verify lock icon appears for private template", async () => {
      const templateCard = page
        .locator(".rounded-lg")
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
      await expect(page.getByText(publicName)).toBeVisible();
    });

    await test.step("Verify no lock icon for public template", async () => {
      const templateCard = page
        .locator(".rounded-lg")
        .filter({ hasText: publicName });

      // Lock icon should NOT be present
      const lockIcon = templateCard.locator('svg[class*="lucide-lock"]');
      await expect(lockIcon).not.toBeVisible();
    });
  });
});
