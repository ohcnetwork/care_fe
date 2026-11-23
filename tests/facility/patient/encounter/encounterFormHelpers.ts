import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";
import { ENCOUNTER_CLASSES } from "tests/facility/patient/encounter/encounterClasses";
import { openEncounterCreateDialog } from "tests/helper/encounter";
import { createTestPatient } from "tests/helper/patient";
import { getFacilityId } from "tests/support/facilityId";

export {
  dischargeDispositionCombobox,
  encounterStatusCombobox,
} from "tests/helper/encounter";

/** Opens the Create Encounter dialog in the shared facility, for a fresh API patient unless one is given. */
export async function openCreateEncounterDialog(
  page: Page,
  patientId?: string,
) {
  const facilityId = getFacilityId();
  // A fresh patient by default: these specs leave their encounters active,
  // and the backend caps active encounters per patient in a facility.
  const encounterPatientId = patientId ?? (await createTestPatient());

  await openEncounterCreateDialog(page, {
    facilityId,
    patientId: encounterPatientId,
  });
}

export async function selectRandomEncounterClass(page: Page) {
  const randomClass = faker.helpers.arrayElement(ENCOUNTER_CLASSES);
  await page.getByRole("button", { name: randomClass }).click();
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
