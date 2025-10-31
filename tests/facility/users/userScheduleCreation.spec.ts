import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Schedule Template Management", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/users/admin`);
    await page.getByRole("link", { name: "Availability" }).click();
  });
  test("should create and verify a weekday schedule template", async ({
    page,
  }) => {
    // Generate test data
    const templateName = faker.lorem.words(2);
    const sessionTitle = faker.lorem.words(2);
    const startTime = "10:00";
    const endTime = "15:00";
    const patientsPerSlot = "300";
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const validFromOffset = 2; // days
    const validTillOffset = 2; // months
    const numberOfSlots = 1; // Single slot per session
    const displayTime = "10 AM - 3 PM"; // Expected time format

    // Start creating schedule template
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Create Template" }).click();

    await expect(
      page.getByRole("textbox", { name: "Template Name *" }),
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Template Name *" })
      .fill(templateName);

    // Select Valid From date
    const validFromLocator = page
      .locator('label:has-text("Valid From")')
      .locator("..")
      .locator('button[data-slot="popover-trigger"]');
    await validFromLocator.click();

    // Click a date in the future (offset days from today)
    const validFromDate = new Date();
    validFromDate.setDate(validFromDate.getDate() + validFromOffset);
    const validFromDateStr = validFromDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    await page
      .getByRole("button", { name: new RegExp(validFromDateStr, "i") })
      .click();

    // Select weekdays
    const formItemDiv = page.locator('div[data-slot="form-item"]');
    for (const day of weekdays) {
      await formItemDiv.getByRole("button", { name: day }).click();
    }

    // Select Valid Till date
    const validTillLocator = page
      .locator('label:has-text("Valid Till")')
      .locator("..")
      .locator('button[data-slot="popover-trigger"]');
    await validTillLocator.click();

    const nextMonthBtn = page.getByRole("button", {
      name: "Next Month",
    });
    await expect(nextMonthBtn).toBeVisible();

    // Navigate to the target month
    for (let i = 0; i < validTillOffset; i++) {
      await nextMonthBtn.click({ force: true });
    }

    // Click a date in the future (offset months from today)
    const validTillDate = new Date();
    validTillDate.setMonth(validTillDate.getMonth() + validTillOffset);
    const validTillDateStr = validTillDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    await page
      .getByRole("button", { name: new RegExp(validTillDateStr, "i") })
      .click();

    // Fill session details
    await page
      .getByRole("textbox", { name: "Session Title *" })
      .fill(sessionTitle);
    await page.getByRole("textbox", { name: "Start Time *" }).fill(startTime);
    await page.getByRole("textbox", { name: "End Time *" }).fill(endTime);
    await page.getByRole("switch", { name: "Auto-fill slot duration" }).click();
    await page
      .getByRole("spinbutton", { name: "Patients per Slot *" })
      .fill(patientsPerSlot);

    // Capture the auto-filled slot duration value from UI
    const slotDurationInput = page.getByRole("spinbutton", {
      name: "Slot duration (mins.)",
    });
    const slotDuration = await slotDurationInput.inputValue();

    // Save template
    await page.getByRole("button", { name: "Save" }).click();

    // Verify success notification
    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Schedule template created successfully" }),
    ).toBeVisible();

    // Wait for the page to return to schedule list
    await page.waitForLoadState("networkidle");

    // Navigate to next month in calendar to find the created schedule
    const nextMonthButton = page.locator('button[name="Go to Next Month"]');
    await expect(nextMonthButton).toBeVisible();
    await nextMonthButton.click();

    // Verify template card on main page
    const scheduleCard = page
      .locator("div.rounded-lg.bg-white")
      .filter({ hasText: templateName });

    await expect(
      scheduleCard.locator("span.text-lg.font-semibold", {
        hasText: templateName,
      }),
    ).toBeVisible();

    await expect(
      scheduleCard.locator("span.text-sm.text-gray-700", {
        hasText: "Scheduled for:",
      }),
    ).toContainText("Mon, Tue, Wed, Thu, Fri");

    await expect(scheduleCard.getByText(sessionTitle)).toBeVisible();

    await expect(
      scheduleCard.locator("span.text-sm", { hasText: "Appointment" }),
    ).toBeVisible();

    await expect(
      scheduleCard.locator("span.text-sm", {
        hasText: `${numberOfSlots} slots of ${slotDuration} mins.`,
      }),
    ).toBeVisible();

    await expect(scheduleCard.getByText(displayTime)).toBeVisible();

    // Open edit form
    await scheduleCard
      .locator('button[data-slot="button"]')
      .filter({ has: page.locator("svg.lucide-pen-line") })
      .first()
      .click();

    // Verify edit form contents
    const editSheet = page.locator(
      'div[role="dialog"][data-slot="sheet-content"]',
    );
    await expect(editSheet).toBeVisible();

    await expect(
      editSheet.locator('h2[data-slot="sheet-title"]', {
        hasText: "Edit Schedule Template",
      }),
    ).toBeVisible();

    // Verify form field values
    await expect(editSheet.locator('input[name="name"]')).toHaveValue(
      templateName,
    );

    // Verify Valid From date is present
    const validFromButton = editSheet
      .locator("label", { hasText: "Valid From" })
      .locator("..")
      .locator('button[data-slot="popover-trigger"]');
    await expect(validFromButton).toBeVisible();
    await expect(validFromButton).not.toBeEmpty();

    // Verify Valid Till date is present
    const validTillButton = editSheet
      .locator("label", { hasText: "Valid Till" })
      .locator("..")
      .locator('button[data-slot="popover-trigger"]');
    await expect(validTillButton).toBeVisible();
    await expect(validTillButton).not.toBeEmpty();

    await expect(editSheet.getByText(sessionTitle)).toBeVisible();

    await expect(
      editSheet.locator('span[data-slot="badge"]', { hasText: "Appointment" }),
    ).toBeVisible();

    // Verify slot configuration
    const slotConfig = editSheet
      .locator("div.flex.flex-col.rounded-md.bg-gray-50", {
        hasText: "Slot Configuration",
      })
      .first();
    await expect(slotConfig).toContainText(slotDuration);
    await expect(slotConfig).toContainText("minutes");
    await expect(slotConfig).toContainText(patientsPerSlot);
    await expect(slotConfig).toContainText("Patients");

    // Verify session capacity
    const sessionCapacity = editSheet
      .locator("div.flex.flex-col.rounded-md.bg-gray-50", {
        hasText: "Session Capacity",
      })
      .first();
    await expect(sessionCapacity).toContainText(numberOfSlots.toString());
    await expect(sessionCapacity).toContainText("Slots");
    await expect(sessionCapacity).toContainText(
      `${patientsPerSlot} Total Patients`,
    );

    // Verify weekday schedules
    for (const day of weekdays) {
      const daySchedule = editSheet.locator("p", { hasText: day });
      await expect(daySchedule).toBeVisible();
      await expect(daySchedule).toContainText(displayTime);
    }
  });
});
