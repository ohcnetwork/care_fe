import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { addMonths, format, setDate } from "date-fns";
import { getFieldErrorMessage } from "tests/helper/error";
import { expectToast } from "tests/helper/ui";
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

  async selectValidPeriod(
    startMonthOffset: number,
    endMonthOffset: number,
  ): Promise<void> {
    const midMonth = (offset: number) =>
      format(
        addMonths(
          setDate(new Date(), SCHEDULE_CONSTANTS.MID_MONTH_DAY),
          offset,
        ),
        "dd/MM/yyyy",
      );

    await this.page.getByRole("button", { name: /^Valid Period/ }).click();
    await this.page
      .getByRole("textbox", { name: "Start date", exact: true })
      .fill(midMonth(startMonthOffset));
    await this.page
      .getByRole("textbox", { name: "End date", exact: true })
      .fill(midMonth(endMonthOffset));
    await this.page.getByRole("button", { name: "Apply", exact: true }).click();
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

  getSlotCountInput() {
    return this.page.locator('input[name="availabilities.0.num_of_slots"]');
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
      .getByRole("button")
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

    await this.verifyValidPeriodPresent();

    await expect(this.sheet.getByText(data.sessionTitle)).toBeVisible();

    await expect(
      this.sheet.locator('span[data-slot="badge"]', { hasText: "Appointment" }),
    ).toBeVisible();

    await this.verifySlotConfiguration(data.slotDuration, data.patientsPerSlot);

    await this.verifySessionCapacity(data.numberOfSlots, data.patientsPerSlot);

    await this.verifyWeekdaySchedules(data.weekdays, data.displayTime);
  }

  private async verifyValidPeriodPresent(): Promise<void> {
    const validPeriod = this.sheet.getByRole("button", {
      name: /^Valid Period/,
    });
    await expect(validPeriod).toBeVisible();
    await expect(validPeriod).toHaveText(/\d{4}$/);
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
    await page.getByRole("tab", { name: "Availability" }).click();
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
    await formPage.selectValidPeriod(1, 2);
    await formPage.selectWeekdays(testData.weekdays);

    await formPage.fillSessionDetails({
      title: testData.sessionTitle,
      startTime: testData.startTime,
      endTime: testData.endTime,
      patientsPerSlot: testData.patientsPerSlot,
    });

    const slotDuration = await formPage.getAutoFilledSlotDuration();

    const encounterType = page.getByRole("combobox", {
      name: /type of encounter/i,
    });
    await expect(encounterType).toHaveText(/not specified/i);
    await encounterType.click();
    await page.getByRole("option", { name: "Ambulatory", exact: true }).click();

    // Submit and verify success
    const [create] = await Promise.all([
      page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          new URL(request.url()).pathname ===
            `/api/v1/facility/${facilityId}/schedule/`,
      ),
      formPage.submitTemplate(),
    ]);
    expect(create.postDataJSON()).toHaveProperty("encounter_type", "amb");
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

  test("should allow clearing and re-entering the number of slots", async ({
    page,
  }) => {
    const testData = ScheduleTestDataFactory.createWeekdaySchedule();
    const formPage = new ScheduleFormPage(page);
    const cardPage = new ScheduleCardPage(page);
    const slotCountInput = formPage.getSlotCountInput();
    const slotDurationInput = page.getByRole("spinbutton", {
      name: "Slot duration (mins.)",
    });

    await test.step("Fill the template form with auto-fill enabled", async () => {
      await page.getByRole("button", { name: "Create Template" }).click();
      await formPage.fillTemplateName(testData.templateName);
      await formPage.selectValidPeriod(1, 2);
      await formPage.selectWeekdays(testData.weekdays);
      await formPage.fillSessionDetails({
        title: testData.sessionTitle,
        startTime: testData.startTime,
        endTime: testData.endTime,
        patientsPerSlot: testData.patientsPerSlot,
      });
      await expect(slotCountInput).toHaveValue("1");
      await expect(slotDurationInput).toHaveValue("300");
    });

    await test.step("Clearing the slot count keeps the field empty", async () => {
      await slotCountInput.clear();
      await expect(slotCountInput).toHaveValue("");
      await expect(slotDurationInput).toHaveValue("");
    });

    await test.step("Saving with an empty slot count shows an error", async () => {
      await formPage.submitTemplate();
      await expect(getFieldErrorMessage(slotCountInput)).toContainText(
        "This field is required",
      );
      await expect(
        page.getByRole("textbox", { name: "Template Name *" }),
      ).toBeVisible();
    });

    await test.step("Entering a new slot count recalculates the duration", async () => {
      await slotCountInput.pressSequentially("6");
      await expect(slotCountInput).toHaveValue("6");
      await expect(slotDurationInput).toHaveValue("50");
      await expect(getFieldErrorMessage(slotCountInput)).toBeHidden();
      await expect(getFieldErrorMessage(slotDurationInput)).toBeHidden();
    });

    await test.step("Template is created with the new slot count", async () => {
      await formPage.submitTemplate();
      await expectToast(page, "Schedule template created successfully");
      await page.getByRole("button", { name: "Next Month" }).click();
      await cardPage.verifyCardContent(testData.templateName, {
        sessionTitle: testData.sessionTitle,
        displayTime: testData.displayTime,
        slotDuration: "50",
        numberOfSlots: 6,
      });
    });
  });

  test("should not validate the number of slots when auto-fill is off", async ({
    page,
  }) => {
    const testData = ScheduleTestDataFactory.createWeekdaySchedule();
    const formPage = new ScheduleFormPage(page);
    const cardPage = new ScheduleCardPage(page);
    const slotCountInput = formPage.getSlotCountInput();
    const slotDurationInput = page.getByRole("spinbutton", {
      name: "Slot duration (mins.)",
    });

    await test.step("Fill the template form with auto-fill enabled", async () => {
      await page.getByRole("button", { name: "Create Template" }).click();
      await formPage.fillTemplateName(testData.templateName);
      await formPage.selectValidPeriod(1, 2);
      await formPage.selectWeekdays(testData.weekdays);
      await formPage.fillSessionDetails({
        title: testData.sessionTitle,
        startTime: testData.startTime,
        endTime: testData.endTime,
        patientsPerSlot: testData.patientsPerSlot,
      });
      await expect(slotCountInput).toHaveValue("1");
    });

    await test.step("Saving with an empty slot count shows an error", async () => {
      await slotCountInput.clear();
      await formPage.submitTemplate();
      await expect(getFieldErrorMessage(slotCountInput)).toContainText(
        "This field is required",
      );
    });

    await test.step("Turning auto-fill off hides the slot count and asks for a duration", async () => {
      await page
        .getByRole("switch", { name: "Auto-fill slot duration" })
        .click();
      await expect(slotCountInput).toBeHidden();
      await expect(slotDurationInput).toBeEnabled();
      await expect(slotDurationInput).toHaveValue("");
    });

    await test.step("Template is created with a manual slot duration", async () => {
      await slotDurationInput.fill("60");
      await formPage.submitTemplate();
      await expectToast(page, "Schedule template created successfully");
      await page.getByRole("button", { name: "Next Month" }).click();
      await cardPage.verifyCardContent(testData.templateName, {
        sessionTitle: testData.sessionTitle,
        displayTime: testData.displayTime,
        slotDuration: "60",
        numberOfSlots: 5,
      });
    });
  });

  test.describe("Schedule exception form", () => {
    test("should reject whitespace-only input in required text fields", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Exceptions", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Add Exception", exact: true })
        .click();

      const sheet = page
        .getByRole("dialog")
        .filter({ hasText: "Add Schedule Exceptions" });
      const reasonInput = sheet.getByRole("textbox", { name: "Reason *" });
      await reasonInput.fill("   ");

      await sheet
        .getByRole("button", { name: "Confirm Unavailability" })
        .click();

      const errorMessage = getFieldErrorMessage(reasonInput);
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveText("This field is required");
    });
  });

  test.describe("Edit schedule template form", () => {
    test("should reject whitespace-only input in required text fields", async ({
      page,
    }) => {
      const testData = ScheduleTestDataFactory.createWeekdaySchedule();
      const formPage = new ScheduleFormPage(page);
      const cardPage = new ScheduleCardPage(page);
      const editSheetPage = new ScheduleEditSheetPage(page);
      const sheet = page
        .getByRole("dialog")
        .filter({ hasText: "Edit Schedule Template" });

      await test.step("Create a template and open its edit sheet", async () => {
        await page.getByRole("button", { name: "Create Template" }).click();
        await formPage.fillTemplateName(testData.templateName);
        await formPage.selectValidPeriod(1, 2);
        await formPage.selectWeekdays(testData.weekdays);
        await formPage.fillSessionDetails({
          title: testData.sessionTitle,
          startTime: testData.startTime,
          endTime: testData.endTime,
          patientsPerSlot: testData.patientsPerSlot,
        });
        await formPage.submitTemplate();
        await expectToast(page, "Schedule template created successfully");
        await page.getByRole("button", { name: "Next Month" }).click();
        await cardPage.openEditForm(testData.templateName);
        await editSheetPage.verifySheetVisible();
      });

      await test.step("Template name rejects only spaces", async () => {
        const templateNameInput = sheet.getByRole("textbox", {
          name: "Template Name *",
        });
        await expect(templateNameInput).toHaveValue(testData.templateName);
        await templateNameInput.fill("   ");
        await sheet.getByRole("button", { name: "Save", exact: true }).click();

        const errorMessage = getFieldErrorMessage(templateNameInput);
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toHaveText("This field is required");
      });

      await test.step("New session title rejects only spaces", async () => {
        await sheet
          .getByRole("button", { name: "Add another session" })
          .click();
        const sessionTitleInput = sheet.getByRole("textbox", {
          name: "Session Title *",
        });
        await sessionTitleInput.fill("   ");
        await sheet
          .getByRole("button", { name: "Create", exact: true })
          .click();

        const errorMessage = getFieldErrorMessage(sessionTitleInput);
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toHaveText("This field is required");
      });
    });
  });
});
