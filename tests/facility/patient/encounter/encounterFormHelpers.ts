import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";
import { ENCOUNTER_CLASSES } from "tests/facility/patient/encounter/encounterClasses";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

export async function openCreateEncounterDialog(page: Page) {
  const facilityId = getFacilityId();
  const patientId = getPatientId();

  await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  await page.getByRole("link", { name: "Patient Home" }).click();

  await expect(
    page.getByRole("button", { name: "Create Encounter" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create Encounter" }).click();
}

export async function selectRandomEncounterClass(page: Page) {
  const randomClass = faker.helpers.arrayElement(ENCOUNTER_CLASSES);
  await page.getByRole("button", { name: randomClass }).click();
}

export async function selectStatusInCreateDialog(page: Page, status: string) {
  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: status, exact: true }).click();
}

export async function openCalendarAndGetNextMonthButton(page: Page) {
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

export function getFutureDateButtonFromCalendar(page: Page) {
  return page
    .getByRole("gridcell")
    .filter({ hasText: /^15$/ })
    .getByRole("button");
}

export function getEncounterCreateDialog(page: Page) {
  return page.getByRole("dialog", { name: "Initiate Patient Encounter" });
}
