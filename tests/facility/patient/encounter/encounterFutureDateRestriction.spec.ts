import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { ENCOUNTER_CLASSES } from "tests/support/encounterClasses";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function openEncounterForm(page: Page) {
  const facilityId = getFacilityId();
  const patientId = getPatientId();

  await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  await page.getByRole("link", { name: "Patient Home" }).click();

  await expect(
    page.getByRole("button", { name: "Create Encounter" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create Encounter" }).click();
}

async function selectRandomEncounterClass(page: Page) {
  const randomClass = faker.helpers.arrayElement(ENCOUNTER_CLASSES);
  await page.getByRole("button", { name: randomClass }).click();
}

async function openCalendarAndGetNextMonthButton(page: Page) {
  await page
    .locator('[data-slot="form-item"]')
    .filter({ hasText: "Date and Time" })
    .locator('[data-slot="popover-trigger"]')
    .click();

  const nextMonthButton = page.getByRole("button", {
    name: "Go to the Next Month",
  });
  await expect(nextMonthButton).toBeVisible();
  return nextMonthButton;
}

function getFutureDateButtonFromCalendar(page: Page) {
  return page
    .getByRole("gridcell")
    .filter({ hasText: /^15$/ })
    .getByRole("button");
}

function getEncounterDialog(page: Page) {
  return page.getByRole("dialog", { name: "Initiate Patient Encounter" });
}

test.describe("Encounter Future Date Restriction", () => {
  test.beforeEach(async ({ page }) => {
    await openEncounterForm(page);
  });

  test("should disable future dates when status is In Progress", async ({
    page,
  }) => {
    // Change status to In Progress
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "In Progress" }).click();

    const nextMonthButton = await openCalendarAndGetNextMonthButton(page);

    if (await nextMonthButton.isEnabled()) {
      await nextMonthButton.click();
      await expect(getFutureDateButtonFromCalendar(page)).toBeDisabled();
      return;
    }

    // If navigation itself is blocked, future date selection is restricted.
    await expect(nextMonthButton).toBeDisabled();
  });

  test("should disable future dates when status is On Hold", async ({
    page,
  }) => {
    // Change status to On Hold
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "On Hold" }).click();

    const nextMonthButton = await openCalendarAndGetNextMonthButton(page);

    if (await nextMonthButton.isEnabled()) {
      await nextMonthButton.click();
      await expect(getFutureDateButtonFromCalendar(page)).toBeDisabled();
      return;
    }

    // If navigation itself is blocked, future date selection is restricted.
    await expect(nextMonthButton).toBeDisabled();
  });

  test("should allow future dates when status is Planned", async ({ page }) => {
    // Select a random encounter class
    await selectRandomEncounterClass(page);

    // Set status to Planned
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Planned" }).click();

    // Select a future date
    const nextMonthButton = await openCalendarAndGetNextMonthButton(page);
    await expect(nextMonthButton).toBeEnabled();
    await nextMonthButton.click();

    const futureDayButton = getFutureDateButtonFromCalendar(page);
    await expect(futureDayButton).toBeEnabled();
    await futureDayButton.click();

    // Submit and verify future-date restriction is not shown for Planned status
    const encounterDialog = getEncounterDialog(page);
    await encounterDialog
      .getByRole("button", { name: /^Create Encounter/ })
      .click();

    // Wait for encounter to be created and dialog to close
    await expect(encounterDialog).not.toBeVisible();

    // Verify Encounter Actions button is visible after encounter creation
    await expect(
      page.getByRole("button", { name: "Encounter Actions" }),
    ).toBeVisible();
  });

  test("should show validation error when switching from Planned to In Progress with future date", async ({
    page,
  }) => {
    // Select a random encounter class
    await selectRandomEncounterClass(page);

    // Set status to Planned first (allows future dates)
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Planned" }).click();

    // Select a future date while Planned
    const nextMonthButton = await openCalendarAndGetNextMonthButton(page);
    await expect(nextMonthButton).toBeEnabled();
    await nextMonthButton.click();

    const futureDayButton = getFutureDateButtonFromCalendar(page);
    await expect(futureDayButton).toBeEnabled();
    await futureDayButton.click();

    // Switch status to In Progress (future date now becomes invalid)
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "In Progress" }).click();

    // Try to submit — zod refine should block with validation error
    const encounterDialog = getEncounterDialog(page);
    await encounterDialog
      .getByRole("button", { name: /^Create Encounter/ })
      .click();

    await expect(
      page.getByText("Future date is only allowed for planned encounters"),
    ).toBeVisible();
  });
});
