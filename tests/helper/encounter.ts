import { expect, test, type Page } from "@playwright/test";
import { setTimeout as delay } from "node:timers/promises";
import { selectFirstAvailableDepartment } from "tests/helper/departmentSelect";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { expectAndDismissToast, expectToast } from "tests/helper/ui";

interface TestEncounterOptions {
  status?: string;
  encounterClass?: string;
  period?: { start: string; end?: string };
  organizations?: string[];
}

/**
 * Creates an encounter through the API and returns its id. Defaults to an
 * in-progress ambulatory encounter starting now.
 */
export async function createTestEncounter(
  facilityId: string,
  patientId: string,
  {
    status = "in_progress",
    encounterClass = "amb",
    period = { start: new Date().toISOString() },
    organizations = [],
  }: TestEncounterOptions = {},
): Promise<string> {
  const headers = adminApiHeaders();
  const body = JSON.stringify({
    patient: patientId,
    facility: facilityId,
    status,
    encounter_class: encounterClass,
    period,
    priority: "routine",
    organizations,
  });
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${apiBaseUrl()}/api/v1/encounter/`, {
      method: "POST",
      headers,
      body,
    });
    if (response.ok) {
      return ((await response.json()) as { id: string }).id;
    }
    const error = await response.text();
    // The backend serializes encounter creation per facility with a lock
    // (the rejected create is rolled back), so retry only that rejection.
    if (
      attempt >= 4 ||
      response.status !== 400 ||
      !error.includes("Encounter creation failed, try again after a while")
    ) {
      throw new Error(
        `Failed to create test encounter: ${response.status} — ${error}`,
      );
    }
    await delay(250 * (attempt + 1));
  }
}

/** Encounter status labels as the encounter forms and header show them. */
export type EncounterStatusLabel =
  | "Planned"
  | "In Progress"
  | "On Hold"
  | "Discharged"
  | "Completed"
  | "Cancelled"
  | "Entered in error"
  | "Discontinued";

export interface CreateEncounterInput {
  facilityId: string;
  patientId: string;
  /** Class button label, e.g. "Ambulatory" (see encounterClasses.ts). Defaults to the form's default. */
  encounterClass?: string;
  /** Status option label: "In Progress", "Planned" or "On Hold". Defaults to the form's default. */
  status?: string;
  /** Priority option label, e.g. "Routine". Defaults to the form's default. */
  priority?: string;
}

/** The labelled combobox next to a `label[data-slot="label"]` (update forms whose labels aren't linked to their triggers). */
function comboboxByLabel(page: Page, label: string | RegExp) {
  return page
    .locator('label[data-slot="label"]')
    .filter({ hasText: label })
    .locator("..")
    .getByRole("combobox");
}

/** The status picker of the encounter update form. */
export function encounterStatusCombobox(page: Page) {
  return comboboxByLabel(page, /^Encounter Status$/);
}

/** The discharge disposition picker of the encounter update form. */
export function dischargeDispositionCombobox(page: Page) {
  return comboboxByLabel(page, /^Discharge Disposition/);
}

/** Opens the patient's home page and its Create Encounter dialog. */
export async function openEncounterCreateDialog(
  page: Page,
  { facilityId, patientId }: { facilityId: string; patientId: string },
): Promise<void> {
  await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  await page.getByRole("link", { name: "Patient Home" }).first().click();

  await expect(
    page.getByRole("button", { name: "Create Encounter" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create Encounter" }).click();
}

/** Fills the open Create Encounter dialog, submits it and returns the new encounter's id once its page opens. */
export async function submitEncounterCreateDialog(
  page: Page,
  {
    encounterClass,
    status,
    priority,
  }: Pick<CreateEncounterInput, "encounterClass" | "status" | "priority"> = {},
): Promise<{ encounterId: string }> {
  if (encounterClass) {
    await page.getByRole("button", { name: encounterClass }).click();
  }
  if (status) {
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: status }).click();
  }
  if (priority) {
    await page.getByRole("combobox", { name: "Priority" }).click();
    await page.getByRole("option", { name: priority }).click();
  }

  const created = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/v1/encounter/",
  );
  await page.getByRole("button", { name: "Create Encounter" }).click();
  const response = await created;
  expect(response.ok(), await response.text()).toBe(true);
  const { id: encounterId } = (await response.json()) as { id: string };

  await expect(page.getByText("Encounter created successfully")).toBeVisible();
  await expect(page).toHaveURL((url) =>
    url.pathname.includes(`/encounter/${encounterId}/updates`),
  );
  return { encounterId };
}

/** Creates an encounter for the patient from Patient Home and returns its id. */
export async function createEncounterViaUi(
  page: Page,
  input: CreateEncounterInput,
): Promise<{ encounterId: string }> {
  return test.step(
    "encounter.create",
    async () => {
      await openEncounterCreateDialog(page, input);
      return submitEncounterCreateDialog(page, input);
    },
    { box: true },
  );
}

/** Opens the encounter update form through the encounter header's edit link. */
export async function openEncounterUpdateForm(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Edit encounter", exact: true }).click();
  await expect(encounterStatusCombobox(page)).toBeVisible();
}

/** Picks a status in the open encounter update form's status picker. */
export async function selectEncounterStatus(
  page: Page,
  status: string,
): Promise<void> {
  await encounterStatusCombobox(page).click();
  await page.getByRole("option", { name: status, exact: true }).click();
}

/** Picks a status in the open update form; "Discharged" goes through "Mark for discharge" with a Home disposition. */
export async function selectEncounterClosingStatus(
  page: Page,
  status: string,
): Promise<void> {
  if (status === "Discharged") {
    await page.getByRole("button", { name: "Mark for discharge" }).click();
    await dischargeDispositionCombobox(page).click();
    await page.getByRole("option", { name: "Home", exact: true }).click();
  } else {
    await selectEncounterStatus(page, status);
  }
}

/** Saves the open encounter update form (no success check). */
export async function saveEncounterUpdateForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
}

/** Marks the open encounter as complete from its Actions tab. */
export async function completeEncounterFromActions(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Actions", exact: true }).click();
  // The page also renders an sr-only "Mark as Completed" button as
  // its keyboard-shortcut target; click the one in the Actions tab.
  await page
    .getByRole("tabpanel", { name: "Actions", exact: true })
    .getByRole("button", { name: "Mark as Completed" })
    .click();
  await page
    .getByRole("alertdialog", { name: "Mark as Complete" })
    .getByRole("button", { name: /^Mark as Complete/ })
    .click();
  await expect(
    page.getByText("Encounter Completed", { exact: true }),
  ).toBeVisible();
}

/**
 * Changes an encounter's status through the UI. "Completed" uses the Actions
 * tab (an inpatient encounter must be discharged first); every other status
 * goes through the encounter update form ("Discharged" via "Mark for discharge").
 */
export async function changeEncounterStatusViaUi(
  page: Page,
  {
    facilityId,
    patientId,
    encounterId,
    status,
  }: {
    facilityId: string;
    patientId: string;
    encounterId: string;
    status: EncounterStatusLabel;
  },
): Promise<void> {
  await test.step(
    "encounter.status.transition",
    async () => {
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
      );
      if (status === "Completed") {
        await completeEncounterFromActions(page);
        return;
      }
      await openEncounterUpdateForm(page);
      await selectEncounterClosingStatus(page, status);
      await saveEncounterUpdateForm(page);
      // Closed too, so a later save in the same test sees its own toast.
      await expectAndDismissToast(page, "Questionnaire submitted successfully");
    },
    { box: true },
  );
}

/** The encounter's "Manage Organizations" (departments) dialog. */
export function encounterDepartmentsDialog(page: Page) {
  return page.getByRole("dialog", { name: "Manage Organizations" });
}

/** A department row with its remove button in the open departments dialog. */
export function encounterDepartmentRow(page: Page, name: string) {
  return encounterDepartmentsDialog(page)
    .locator("div")
    .filter({ has: page.getByText(name, { exact: true }) })
    .filter({ has: page.locator(".lucide-trash-2") });
}

/** Opens the encounter's departments dialog from its Actions tab. */
export async function openEncounterDepartmentsDialog(
  page: Page,
  {
    facilityId,
    patientId,
    encounterId,
  }: { facilityId: string; patientId: string; encounterId: string },
): Promise<void> {
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
  );
  await page.getByRole("tab", { name: "Actions" }).click();
  await page
    .getByRole("tabpanel", { name: "Actions" })
    .getByRole("button", { name: "Update Department" })
    .click();
  await expect(encounterDepartmentsDialog(page)).toBeVisible();
}

/** Links the first available facility department to the encounter. */
export async function linkEncounterDepartmentViaUi(
  page: Page,
  input: { facilityId: string; patientId: string; encounterId: string },
): Promise<void> {
  await test.step(
    "encounter.department.link",
    async () => {
      await openEncounterDepartmentsDialog(page, input);
      await selectFirstAvailableDepartment(
        page,
        encounterDepartmentsDialog(page),
      );
      await encounterDepartmentsDialog(page)
        .getByRole("button", { name: "Add Organizations" })
        .click();
      await expectToast(page, "Organization added successfully");
    },
    { box: true },
  );
}

/** Removes a linked department from the encounter. */
export async function unlinkEncounterDepartmentViaUi(
  page: Page,
  {
    departmentName,
    ...encounter
  }: {
    facilityId: string;
    patientId: string;
    encounterId: string;
    departmentName: string;
  },
): Promise<void> {
  await test.step(
    "encounter.department.unlink",
    async () => {
      await openEncounterDepartmentsDialog(page, encounter);
      // The current departments list renders each one as a row with its name
      // and a trash button.
      await encounterDepartmentRow(page, departmentName)
        .last()
        .getByRole("button")
        .click();
      await expectToast(page, "Organization removed successfully");
    },
    { box: true },
  );
}
