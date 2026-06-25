import { expect, test, type Page } from "@playwright/test";
import {
  getEncounterCreateDialog,
  getFutureDateButtonFromCalendar,
  openCalendarAndGetNextMonthButton,
  openCreateEncounterDialog,
  selectRandomEncounterClass,
  selectStatusInCreateDialog,
} from "tests/facility/patient/encounter/encounterFormHelpers";

test.use({ storageState: "tests/.auth/user.json" });

const VALIDATION_ERROR_TEXT =
  "period: Value error, Start Date cannot be greater than End Date";

async function selectFutureDateInCalendar(page: Page) {
  const nextMonthButton = await openCalendarAndGetNextMonthButton(page);
  await expect(nextMonthButton).toBeEnabled();
  await nextMonthButton.click();

  const futureDayButton = getFutureDateButtonFromCalendar(page);
  await expect(futureDayButton).toBeEnabled();
  await futureDayButton.click();
}

async function createPlannedEncounterWithFutureDate(page: Page) {
  await openCreateEncounterDialog(page);
  await selectRandomEncounterClass(page);
  await selectStatusInCreateDialog(page, "Planned");
  await selectFutureDateInCalendar(page);

  const dialog = getEncounterCreateDialog(page);
  await dialog.getByRole("button", { name: /^Create Encounter/ }).click();

  // Submit navigates to the encounter detail page.
  await page.waitForURL(/\/encounter\/[^/]+/);
  await expect(
    page.getByRole("button", { name: "Encounter Actions" }),
  ).toBeVisible();
}

// Update-encounter form uses a bare <Label> + <SelectTrigger> (no FormLabel/htmlFor),
// so the combobox has no programmatic accessible name. Anchor on the label and walk
// to its immediate parent (the space-y-2 wrapper that contains exactly one combobox).
function encounterStatusCombobox(page: Page) {
  return page
    .locator('label[data-slot="label"]')
    .filter({ hasText: /^Encounter Status$/ })
    .locator("xpath=..")
    .getByRole("combobox");
}

async function openEncounterUpdateForm(page: Page) {
  await page.getByRole("tab", { name: "Details" }).click();
  await page.getByRole("link", { name: "Update Encounter" }).click();
  await expect(encounterStatusCombobox(page)).toBeVisible();
}

async function changeStatus(page: Page, status: string) {
  await encounterStatusCombobox(page).click();
  await page.getByRole("option", { name: status, exact: true }).click();
}

async function submitQuestionnaire(page: Page) {
  await page.getByRole("button", { name: "Submit", exact: true }).click();
}

async function expectSubmissionSuccess(page: Page) {
  await expect(
    page.getByText("Questionnaire submitted successfully"),
  ).toBeVisible();
}

async function expectSubmissionBlockedByPeriodError(page: Page) {
  await expect(page.getByText("Failed to submit questionnaire")).toBeVisible();
  await expect(page.getByText(VALIDATION_ERROR_TEXT)).toBeVisible();
}

// Ensures the encounter ends in a terminal state so the patient's 5-live-encounter
// limit isn't reached across repeated runs.
async function cancelEncounterFromCurrentForm(page: Page) {
  await changeStatus(page, "Cancelled");
  await submitQuestionnaire(page);
  await expectSubmissionSuccess(page);
}

test.describe("Planned Encounter Status Transition", () => {
  test.beforeEach(async ({ page }) => {
    await createPlannedEncounterWithFutureDate(page);
  });

  test("allows transition from Planned to In Progress", async ({ page }) => {
    await test.step("Open update form", async () => {
      await openEncounterUpdateForm(page);
    });

    await test.step("Transition Planned to In Progress", async () => {
      await changeStatus(page, "In Progress");
      await submitQuestionnaire(page);
      await expectSubmissionSuccess(page);
    });

    await test.step("Cleanup: cancel encounter", async () => {
      await openEncounterUpdateForm(page);
      await cancelEncounterFromCurrentForm(page);
    });
  });

  test("allows transition from Planned to On Hold", async ({ page }) => {
    await test.step("Open update form", async () => {
      await openEncounterUpdateForm(page);
    });

    await test.step("Transition Planned to On Hold", async () => {
      await changeStatus(page, "On Hold");
      await submitQuestionnaire(page);
      await expectSubmissionSuccess(page);
    });

    await test.step("Cleanup: cancel encounter", async () => {
      await openEncounterUpdateForm(page);
      await cancelEncounterFromCurrentForm(page);
    });
  });

  test("allows transition from Planned to Cancelled", async ({ page }) => {
    await test.step("Open update form", async () => {
      await openEncounterUpdateForm(page);
    });

    await test.step("Transition Planned to Cancelled", async () => {
      await cancelEncounterFromCurrentForm(page);
    });
  });

  test("allows transition from Planned to Entered in error", async ({
    page,
  }) => {
    await test.step("Open update form", async () => {
      await openEncounterUpdateForm(page);
    });

    await test.step("Transition Planned to Entered in error", async () => {
      await changeStatus(page, "Entered in error");
      await submitQuestionnaire(page);
      await expectSubmissionSuccess(page);
    });
  });

  test("blocks transition from Planned to Completed with period error", async ({
    page,
  }) => {
    await test.step("Open update form", async () => {
      await openEncounterUpdateForm(page);
    });

    await test.step("Attempt Planned to Completed", async () => {
      await changeStatus(page, "Completed");
      await submitQuestionnaire(page);
      await expectSubmissionBlockedByPeriodError(page);
    });

    await test.step("Cleanup: cancel encounter (still Planned on backend)", async () => {
      // Backend rejected the transition, so the encounter is still Planned.
      // Selecting Cancelled clears the auto-set end date (see EncounterQuestion
      // useEffect handling for future-start Cancelled/EnteredInError), so this
      // submit succeeds and moves the encounter to a terminal state.
      await cancelEncounterFromCurrentForm(page);
    });
  });

  test("blocks transition from Planned to Discontinued with period error", async ({
    page,
  }) => {
    await test.step("Open update form", async () => {
      await openEncounterUpdateForm(page);
    });

    await test.step("Attempt Planned to Discontinued", async () => {
      await changeStatus(page, "Discontinued");
      await submitQuestionnaire(page);
      await expectSubmissionBlockedByPeriodError(page);
    });

    await test.step("Cleanup: cancel encounter (still Planned on backend)", async () => {
      await cancelEncounterFromCurrentForm(page);
    });
  });
});
