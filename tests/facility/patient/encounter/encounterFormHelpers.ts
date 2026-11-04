import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";
import { ENCOUNTER_CLASSES } from "tests/facility/patient/encounter/encounterClasses";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

/**
 * Create a patient through the API.
 *
 * A patient can have only five active encounters in a facility. Tests that
 * create encounters use their own patient, so they do not fill up the shared one.
 */
export async function createEncounterTestPatient(): Promise<string> {
  const headers = getApiHeaders();
  const organizations = await fetch(
    `${getApiUrl()}/api/v1/organization/?org_type=govt&limit=1`,
    { headers },
  );
  if (!organizations.ok) {
    throw new Error(`Failed to fetch organizations: ${organizations.status}`);
  }
  const { results } = (await organizations.json()) as {
    results: { id: string }[];
  };
  const geoOrganizationId = results[0]?.id;
  if (!geoOrganizationId) throw new Error("No govt organization found");

  // Patient creation takes a global lock, so parallel workers can collide.
  // The backend reports this as a 400, like a validation error, so match the
  // lock message to decide whether to retry.
  let error = "";
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(`${getApiUrl()}/api/v1/patient/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: `Encounter Test ${faker.string.alphanumeric(6)}`,
        gender: "male",
        phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
        date_of_birth: "1990-01-15",
        geo_organization: geoOrganizationId,
        identifiers: [],
      }),
    });
    if (response.ok) return ((await response.json()) as { id: string }).id;

    error = `${response.status} — ${await response.text()}`;
    if (!error.includes("try again after a while")) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw new Error(`Failed to create patient: ${error}`);
}

export async function openCreateEncounterDialog(
  page: Page,
  patientId = getPatientId(),
) {
  const facilityId = getFacilityId();

  await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  await page.getByRole("link", { name: "Patient Home" }).first().click();

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
  await getEncounterCreateDialog(page)
    .getByRole("combobox", { name: "Status", exact: true })
    .click();
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

function comboboxByLabel(page: Page, label: string | RegExp) {
  return page
    .locator('label[data-slot="label"]')
    .filter({ hasText: label })
    .locator("..")
    .getByRole("combobox");
}

export function encounterStatusCombobox(page: Page) {
  return comboboxByLabel(page, /^Encounter Status$/);
}

export function dischargeDispositionCombobox(page: Page) {
  return comboboxByLabel(page, /^Discharge Disposition/);
}
