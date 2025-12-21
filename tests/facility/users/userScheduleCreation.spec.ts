import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// Constants
const SCHEDULE_CONSTANTS = {
  DEFAULT_SLOT_COUNT: 1,
  MID_MONTH_DAY: 15,
  TIME_DISPLAY_FORMAT: {
    "10:00-15:00": "10 AM - 3 PM",
  },
  WEEKDAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  WEEKDAY_ABBREVIATIONS: "Mon, Tue, Wed, Thu, Fri",
} as const;

// Types
interface ScheduleTestData {
  templateName: string;
  sessionTitle: string;
  startTime: string;
  endTime: string;
  patientsPerSlot: string;
  weekdays: readonly string[];
  displayTime: string;
}

// Helper Classes

class ScheduleFormPage {
  constructor(private readonly page: Page) {}

  async fillTemplateName(name: string): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "Template Name *" })
      .fill(name);
  }

  async selectMidMonthDate(
    datePickerIndex: "first" | "second",
    monthsToNavigate: number,
  ): Promise<void> {
    const pickerButton =
      datePickerIndex === "first"
        ? this.page.getByRole("button", { name: "Pick a date" }).first()
        : this.page
            .locator('label:has-text("Valid Till")')
            .locator("..")
            .locator('button[data-slot="popover-trigger"]');

    await pickerButton.click();

    const nextMonthBtn = this.page.getByRole("button", {
      name: "Go to the Next Month",
    });
    await expect(nextMonthBtn).toBeVisible();

    for (let i = 0; i < monthsToNavigate; i++) {
      await nextMonthBtn.click({ force: true });
    }

    await this.page
      .getByRole("gridcell")
      .filter({ hasText: /^15$/ })
      .getByRole("button")
      .click();
  }

  async selectWeekdays(weekdays: readonly string[]): Promise<void> {
    const formItemDiv = this.page.locator('div[data-slot="form-item"]');
    for (const day of weekdays) {
      await formItemDiv.getByRole("button", { name: day }).click();
    }
  }

  async fillSessionDetails(data: {
    title: string;
    startTime: string;
    endTime: string;
    patientsPerSlot: string;
  }): Promise<void> {
    await this.page
      .getByRole("textbox", { name: "Session Title *" })
      .fill(data.title);
    await this.page
      .getByRole("textbox", { name: "Start Time *" })
      .fill(data.startTime);
    await this.page
      .getByRole("textbox", { name: "End Time *" })
      .fill(data.endTime);
    await this.page
      .getByRole("switch", { name: "Auto-fill slot duration" })
      .click();
    await this.page
      .getByRole("spinbutton", { name: "Patients per Slot *" })
      .fill(data.patientsPerSlot);
  }

  async getAutoFilledSlotDuration(): Promise<string> {
    const slotDurationInput = this.page.getByRole("spinbutton", {
      name: "Slot duration (mins.)",
    });
    return await slotDurationInput.inputValue();
  }

  async submitTemplate(): Promise<void> {
    await this.page.getByRole("button", { name: "Save" }).click();
  }
}

class ScheduleCardPage {
  constructor(private readonly page: Page) {}

  getScheduleCard(templateName: string) {
    return this.page
      .locator("div.rounded-lg.bg-white")
      .filter({ hasText: templateName });
  }

  async verifyCardContent(
    templateName: string,
    data: {
      sessionTitle: string;
      displayTime: string;
      slotDuration: string;
      numberOfSlots: number;
    },
  ): Promise<void> {
    const card = this.getScheduleCard(templateName);

    await expect(
      card.locator("span.text-lg.font-semibold", { hasText: templateName }),
    ).toBeVisible();

    await expect(
      card.locator("span.text-sm.text-gray-700", {
        hasText: "Scheduled for:",
      }),
    ).toContainText(SCHEDULE_CONSTANTS.WEEKDAY_ABBREVIATIONS);

    await expect(card.getByText(data.sessionTitle)).toBeVisible();

    await expect(
      card.locator("span.text-sm", { hasText: "Appointment" }),
    ).toBeVisible();

    await expect(
      card.locator("span.text-sm", {
        hasText: `${data.numberOfSlots} slots of ${data.slotDuration} mins.`,
      }),
    ).toBeVisible();

    await expect(card.getByText(data.displayTime)).toBeVisible();
  }

  async openEditForm(templateName: string): Promise<void> {
    const card = this.getScheduleCard(templateName);
    await card
      .locator('button[data-slot="button"]')
      .filter({ has: this.page.locator("svg.lucide-pen-line") })
      .first()
      .click();
  }
}

class ScheduleEditSheetPage {
  constructor(private readonly page: Page) {}

  private get sheet() {
    return this.page.locator('div[role="dialog"][data-slot="sheet-content"]');
  }

  async verifySheetVisible(): Promise<void> {
    await expect(this.sheet).toBeVisible();
    await expect(
      this.sheet.locator('h2[data-slot="sheet-title"]', {
        hasText: "Edit Schedule Template",
      }),
    ).toBeVisible();
  }

  async verifyTemplateDetails(data: {
    templateName: string;
    sessionTitle: string;
    slotDuration: string;
    patientsPerSlot: string;
    numberOfSlots: number;
    weekdays: readonly string[];
    displayTime: string;
  }): Promise<void> {
    await expect(this.sheet.locator('input[name="name"]')).toHaveValue(
      data.templateName,
    );

    await this.verifyDateFieldsPresent();

    await expect(this.sheet.getByText(data.sessionTitle)).toBeVisible();

    await expect(
      this.sheet.locator('span[data-slot="badge"]', { hasText: "Appointment" }),
    ).toBeVisible();

    await this.verifySlotConfiguration(data.slotDuration, data.patientsPerSlot);

    await this.verifySessionCapacity(data.numberOfSlots, data.patientsPerSlot);

    await this.verifyWeekdaySchedules(data.weekdays, data.displayTime);
  }

  private async verifyDateFieldsPresent(): Promise<void> {
    const validFromButton = this.sheet
      .locator("label", { hasText: "Valid From" })
      .locator("..")
      .locator('button[data-slot="popover-trigger"]');
    await expect(validFromButton).toBeVisible();
    await expect(validFromButton).not.toBeEmpty();

    const validTillButton = this.sheet
      .locator("label", { hasText: "Valid Till" })
      .locator("..")
      .locator('button[data-slot="popover-trigger"]');
    await expect(validTillButton).toBeVisible();
    await expect(validTillButton).not.toBeEmpty();
  }

  private async verifySlotConfiguration(
    slotDuration: string,
    patientsPerSlot: string,
  ): Promise<void> {
    const slotConfig = this.sheet
      .locator("div.flex.flex-col.rounded-md.bg-gray-50", {
        hasText: "Slot Configuration",
      })
      .first();
    await expect(slotConfig).toContainText(slotDuration);
    await expect(slotConfig).toContainText("minutes");
    await expect(slotConfig).toContainText(patientsPerSlot);
    await expect(slotConfig).toContainText("Patients");
  }

  private async verifySessionCapacity(
    numberOfSlots: number,
    patientsPerSlot: string,
  ): Promise<void> {
    const sessionCapacity = this.sheet
      .locator("div.flex.flex-col.rounded-md.bg-gray-50", {
        hasText: "Session Capacity",
      })
      .first();
    await expect(sessionCapacity).toContainText(numberOfSlots.toString());
    await expect(sessionCapacity).toContainText("Slots");
    await expect(sessionCapacity).toContainText(
      `${patientsPerSlot} Total Patients`,
    );
  }

  private async verifyWeekdaySchedules(
    weekdays: readonly string[],
    displayTime: string,
  ): Promise<void> {
    for (const day of weekdays) {
      const daySchedule = this.sheet.locator("p", { hasText: day });
      await expect(daySchedule).toBeVisible();
      await expect(daySchedule).toContainText(displayTime);
    }
  }
}

// Test Data Factory
class ScheduleTestDataFactory {
  static createWeekdaySchedule(): ScheduleTestData {
    return {
      templateName: faker.lorem.words(2),
      sessionTitle: faker.lorem.words(2),
      startTime: "10:00",
      endTime: "15:00",
      patientsPerSlot: "300",
      weekdays: SCHEDULE_CONSTANTS.WEEKDAYS,
      displayTime: "10 AM - 3 PM",
    };
  }
}

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
    const testData = ScheduleTestDataFactory.createWeekdaySchedule();
    const formPage = new ScheduleFormPage(page);
    const cardPage = new ScheduleCardPage(page);
    const editSheetPage = new ScheduleEditSheetPage(page);

    // Navigate to create template form - wait for button to be visible
    await expect(
      page.getByRole("button", { name: "Create Template" }),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Create Template" }).click();
    await expect(
      page.getByRole("textbox", { name: "Template Name *" }),
    ).toBeVisible();

    // Fill template form
    await formPage.fillTemplateName(testData.templateName);
    await formPage.selectMidMonthDate("first", 1);
    await formPage.selectWeekdays(testData.weekdays);
    await formPage.selectMidMonthDate("second", 2);

    await formPage.fillSessionDetails({
      title: testData.sessionTitle,
      startTime: testData.startTime,
      endTime: testData.endTime,
      patientsPerSlot: testData.patientsPerSlot,
    });

    const slotDuration = await formPage.getAutoFilledSlotDuration();

    // Submit and verify success
    await formPage.submitTemplate();
    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Schedule template created successfully" }),
    ).toBeVisible();

    // Navigate to created schedule - wait for Next Month button to be visible
    const nextMonthButton = page.getByRole("button", { name: "Next Month" });
    await expect(nextMonthButton).toBeVisible({ timeout: 10000 });
    await nextMonthButton.click();

    // Verify schedule card
    await cardPage.verifyCardContent(testData.templateName, {
      sessionTitle: testData.sessionTitle,
      displayTime: testData.displayTime,
      slotDuration,
      numberOfSlots: SCHEDULE_CONSTANTS.DEFAULT_SLOT_COUNT,
    });

    // Open and verify edit form
    await cardPage.openEditForm(testData.templateName);
    await editSheetPage.verifySheetVisible();
    await editSheetPage.verifyTemplateDetails({
      templateName: testData.templateName,
      sessionTitle: testData.sessionTitle,
      slotDuration,
      patientsPerSlot: testData.patientsPerSlot,
      numberOfSlots: SCHEDULE_CONSTANTS.DEFAULT_SLOT_COUNT,
      weekdays: testData.weekdays,
      displayTime: testData.displayTime,
    });
  });
});
