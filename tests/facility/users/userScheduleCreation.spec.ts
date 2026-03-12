import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// Constants
const SCHEDULE_CONSTANTS = {
  DEFAULT_SLOT_COUNT: 1,
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

async function fillTemplateName(page: Page, name: string): Promise<void> {
  await page.getByRole("textbox", { name: "Template Name *" }).fill(name);
}

async function selectMidMonthDate(
  page: Page,
  datePickerIndex: "first" | "second",
  monthsToNavigate: number,
): Promise<void> {
  const pickerButton =
    datePickerIndex === "first"
      ? page.getByRole("button", { name: "Pick a date" }).first()
      : page
          .locator('label:has-text("Valid Till")')
          .locator("..")
          .locator('button[data-slot="popover-trigger"]');

  await pickerButton.click();

  const nextMonthBtn = page.getByRole("button", {
    name: "Go to the Next Month",
  });
  await expect(nextMonthBtn).toBeVisible();

  for (let i = 0; i < monthsToNavigate; i++) {
    await nextMonthBtn.click({ force: true });
  }

  await page
    .getByRole("gridcell")
    .filter({ hasText: /^15$/ })
    .getByRole("button")
    .click();
}

async function selectWeekdays(
  page: Page,
  weekdays: readonly string[],
): Promise<void> {
  const formItemDiv = page.locator('div[data-slot="form-item"]');
  for (const day of weekdays) {
    await formItemDiv.getByRole("button", { name: day }).click();
  }
}

async function fillSessionDetails(
  page: Page,
  data: {
    title: string;
    startTime: string;
    endTime: string;
    patientsPerSlot: string;
  },
): Promise<void> {
  await page.getByRole("textbox", { name: "Session Title *" }).fill(data.title);
  await page
    .getByRole("textbox", { name: "Start Time *" })
    .fill(data.startTime);
  await page.getByRole("textbox", { name: "End Time *" }).fill(data.endTime);
  await page.getByRole("switch", { name: "Auto-fill slot duration" }).click();
  await page
    .getByRole("spinbutton", { name: "Patients per Slot *" })
    .fill(data.patientsPerSlot);
}

async function getAutoFilledSlotDuration(page: Page): Promise<string> {
  const slotDurationInput = page.getByRole("spinbutton", {
    name: "Slot duration (mins.)",
  });
  return await slotDurationInput.inputValue();
}

async function submitTemplate(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Save" }).click();
}

function getScheduleCard(page: Page, templateName: string) {
  return page
    .locator("div.rounded-lg.bg-white")
    .filter({ hasText: templateName });
}

async function verifyCardContent(
  page: Page,
  templateName: string,
  data: {
    sessionTitle: string;
    displayTime: string;
    slotDuration: string;
    numberOfSlots: number;
  },
): Promise<void> {
  const card = getScheduleCard(page, templateName);

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

async function openEditForm(page: Page, templateName: string): Promise<void> {
  const card = getScheduleCard(page, templateName);
  await card
    .locator('button[data-slot="button"]')
    .filter({ has: page.locator("svg.lucide-pen-line") })
    .first()
    .click();
}

function getEditSheet(page: Page) {
  return page.locator('div[role="dialog"][data-slot="sheet-content"]');
}

async function verifySheetVisible(page: Page): Promise<void> {
  const sheet = getEditSheet(page);
  await expect(sheet).toBeVisible();
  await expect(
    sheet.locator('h2[data-slot="sheet-title"]', {
      hasText: "Edit Schedule Template",
    }),
  ).toBeVisible();
}

async function verifyDateFieldsPresent(page: Page): Promise<void> {
  const sheet = getEditSheet(page);
  const validFromButton = sheet
    .locator("label", { hasText: "Valid From" })
    .locator("..")
    .locator('button[data-slot="popover-trigger"]');
  await expect(validFromButton).toBeVisible();
  await expect(validFromButton).not.toBeEmpty();

  const validTillButton = sheet
    .locator("label", { hasText: "Valid Till" })
    .locator("..")
    .locator('button[data-slot="popover-trigger"]');
  await expect(validTillButton).toBeVisible();
  await expect(validTillButton).not.toBeEmpty();
}

async function verifySlotConfiguration(
  page: Page,
  slotDuration: string,
  patientsPerSlot: string,
): Promise<void> {
  const sheet = getEditSheet(page);
  const slotConfig = sheet
    .locator("div.flex.flex-col.rounded-md.bg-gray-50", {
      hasText: "Slot Configuration",
    })
    .first();
  await expect(slotConfig).toContainText(slotDuration);
  await expect(slotConfig).toContainText("minutes");
  await expect(slotConfig).toContainText(patientsPerSlot);
  await expect(slotConfig).toContainText("Patients");
}

async function verifySessionCapacity(
  page: Page,
  numberOfSlots: number,
  patientsPerSlot: string,
): Promise<void> {
  const sheet = getEditSheet(page);
  const sessionCapacity = sheet
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

async function verifyWeekdaySchedules(
  page: Page,
  weekdays: readonly string[],
  displayTime: string,
): Promise<void> {
  const sheet = getEditSheet(page);
  for (const day of weekdays) {
    const daySchedule = sheet.locator("p", { hasText: day });
    await expect(daySchedule).toBeVisible();
    await expect(daySchedule).toContainText(displayTime);
  }
}

async function verifyTemplateDetails(
  page: Page,
  data: {
    templateName: string;
    sessionTitle: string;
    slotDuration: string;
    patientsPerSlot: string;
    numberOfSlots: number;
    weekdays: readonly string[];
    displayTime: string;
  },
): Promise<void> {
  const sheet = getEditSheet(page);

  await expect(sheet.locator('input[name="name"]')).toHaveValue(
    data.templateName,
  );

  await verifyDateFieldsPresent(page);

  await expect(sheet.getByText(data.sessionTitle)).toBeVisible();

  await expect(
    sheet.locator('span[data-slot="badge"]', { hasText: "Appointment" }),
  ).toBeVisible();

  await verifySlotConfiguration(page, data.slotDuration, data.patientsPerSlot);
  await verifySessionCapacity(page, data.numberOfSlots, data.patientsPerSlot);
  await verifyWeekdaySchedules(page, data.weekdays, data.displayTime);
}

function createWeekdaySchedule(): ScheduleTestData {
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
    const testData = createWeekdaySchedule();

    // Navigate to create template form - wait for button to be visible
    await expect(
      page.getByRole("button", { name: "Create Template" }),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Create Template" }).click();
    await expect(
      page.getByRole("textbox", { name: "Template Name *" }),
    ).toBeVisible();

    // Fill template form
    await fillTemplateName(page, testData.templateName);
    await selectMidMonthDate(page, "first", 1);
    await selectWeekdays(page, testData.weekdays);
    await selectMidMonthDate(page, "second", 2);

    await fillSessionDetails(page, {
      title: testData.sessionTitle,
      startTime: testData.startTime,
      endTime: testData.endTime,
      patientsPerSlot: testData.patientsPerSlot,
    });

    const slotDuration = await getAutoFilledSlotDuration(page);

    // Submit and verify success
    await submitTemplate(page);
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
    await verifyCardContent(page, testData.templateName, {
      sessionTitle: testData.sessionTitle,
      displayTime: testData.displayTime,
      slotDuration,
      numberOfSlots: SCHEDULE_CONSTANTS.DEFAULT_SLOT_COUNT,
    });

    // Open and verify edit form
    await openEditForm(page, testData.templateName);
    await verifySheetVisible(page);
    await verifyTemplateDetails(page, {
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
