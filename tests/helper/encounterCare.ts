import { faker } from "@faker-js/faker";
import { expect, type Page, test } from "@playwright/test";
import {
  frequencies,
  instructions,
  medicineNames,
} from "tests/facility/patient/encounter/medicine/prescriptionTestData";
import { submitAndExpectSuccess } from "tests/helper/questionnaire";
import { expectToast } from "tests/helper/ui";

/**
 * Capability steps for work done inside an encounter: care team, notes and
 * prescriptions. Each step opens the encounter itself from the ids it gets.
 */

interface EncounterRef {
  facilityId: string;
  patientId: string;
  encounterId: string;
}

/** App path of an encounter page tab, e.g. "updates" or "notes". */
function encounterTabUrl(
  { facilityId, patientId, encounterId }: EncounterRef,
  tab: string,
) {
  return `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/${tab}`;
}

// ---------------------------------------------------------------------------
// Care team
// ---------------------------------------------------------------------------

/** Usernames the care team specs pick members from. */
export const CARE_TEAM_TEST_USERNAMES = ["care-doctor", "admin"];

/** Practitioner roles the care team specs pick from. */
export const CARE_TEAM_TEST_ROLES = [
  "Primary healthcare service",
  "Acupuncturist",
  "Orthotist and prosthetist",
];

/** Opens the "Manage Care Team" sheet from the encounter's Actions tab. */
export async function openCareTeamDialog(page: Page) {
  await page.getByRole("tab", { name: "Actions" }).click();
  await page.getByRole("button", { name: "Manage Care Team" }).click();
  await expect(
    page.getByRole("dialog", { name: "Manage Care Team" }),
  ).toBeVisible();
}

/** Picks a member by username in the open care team sheet. */
export async function selectCareTeamMember(page: Page, userName: string) {
  const memberSelector = page
    .getByRole("combobox")
    .filter({ hasText: "Select Member" });
  await expect(memberSelector).toBeEnabled();
  await memberSelector.click();
  await page.getByPlaceholder("Search").fill(userName);
  await page.getByRole("option", { name: userName }).first().click();
}

/** Picks a practitioner role in the open care team sheet. */
export async function selectCareTeamRole(page: Page, role: string) {
  await page.getByRole("combobox").filter({ hasText: "Select Role" }).click();
  await page.getByPlaceholder("Select Role").fill(role);
  await page.getByRole("option", { name: role, exact: true }).click();
}

export interface AddCareTeamMemberInput extends EncounterRef {
  /** Username to search for; defaults to a random CARE_TEAM_TEST_USERNAMES entry. */
  userName?: string;
  /** Role label; defaults to a random CARE_TEAM_TEST_ROLES entry. */
  role?: string;
}

/**
 * Adds a member with a role to the encounter's care team and waits for the
 * success toast. The "Manage Care Team" sheet stays open afterwards.
 */
export async function addCareTeamMemberViaUi(
  page: Page,
  {
    userName = faker.helpers.arrayElement(CARE_TEAM_TEST_USERNAMES),
    role = faker.helpers.arrayElement(CARE_TEAM_TEST_ROLES),
    ...encounter
  }: AddCareTeamMemberInput,
): Promise<{ memberName: string; role: string }> {
  await test.step(
    "encounter.careteam.assign",
    async () => {
      await page.goto(encounterTabUrl(encounter, "updates"));
      await openCareTeamDialog(page);
      await selectCareTeamMember(page, userName);
      await selectCareTeamRole(page, role);
      await page.getByRole("button", { name: "Add" }).click();
      await expectToast(page, /member added successfully/i);
    },
    { box: true },
  );

  return { memberName: userName, role };
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export interface CreateEncounterNoteThreadInput extends EncounterRef {
  title?: string;
  /** When given, also posts this as the thread's first message. */
  message?: string;
}

/** Starts a discussion thread on the encounter's Notes tab (optionally with a first message). */
export async function createEncounterNoteThreadViaUi(
  page: Page,
  {
    title = `Encounter Note ${faker.string.alphanumeric(8)}`,
    message,
    ...encounter
  }: CreateEncounterNoteThreadInput,
): Promise<{ title: string }> {
  await test.step(
    "encounter.notes.create",
    async () => {
      await page.goto(encounterTabUrl(encounter, "notes"));
      // Wait for notes section to load
      await expect(
        page.getByRole("button", { name: "New", exact: true }),
      ).toBeVisible();

      await page.getByRole("button", { name: "New", exact: true }).click();
      await page.getByPlaceholder("Enter discussion title...").fill(title);
      await page.getByRole("button", { name: /Create/i }).click();
      await expect(page.getByText("Thread created successfully")).toBeVisible();

      if (message !== undefined) {
        const messageInput = page.getByPlaceholder("Type your message...");
        await messageInput.fill(message);
        await page.getByRole("button", { name: "Send message" }).click();
        // The input clears once the message is sent
        await expect(messageInput).toBeEmpty();
      }
    },
    { box: true },
  );

  return { title };
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

export interface PrescribeMedicationInput extends EncounterRef {
  /** Defaults to a random entry of prescriptionTestData's medicineNames. */
  medicineName?: string;
  /** Dose value; 1 renders plain, anything else highlighted. Defaults to 1–100. */
  dosage?: string;
  frequency?: { input: string; display: string };
  instruction?: string;
  /** Additional notes; pass a unique value to find the row afterwards. */
  notes?: string;
}

/**
 * Prescribes one medication from the encounter's Medications tab (Create →
 * medication request form → Save Changes) and waits for the success toast.
 * Returns what it entered.
 */
export async function prescribeMedicationViaUi(
  page: Page,
  {
    medicineName = faker.helpers.arrayElement(medicineNames),
    dosage = faker.number.int({ min: 1, max: 100 }).toString(),
    frequency = faker.helpers.arrayElement(frequencies),
    instruction = faker.helpers.arrayElement(instructions),
    notes = `Prescription ${faker.string.uuid()}`,
    ...encounter
  }: PrescribeMedicationInput,
): Promise<{
  medicineName: string;
  dosage: string;
  frequency: { input: string; display: string };
  instruction: string;
  notes: string;
}> {
  await test.step(
    "encounter.medication.prescribe",
    async () => {
      await page.goto(encounterTabUrl(encounter, "updates"));
      await page.getByRole("tab", { name: "Medications" }).click();

      // Open prescription form
      await page.getByRole("link", { name: /Create/i }).click();
      // Wait for the "Add Medication" button to be visible instead of networkidle
      await expect(
        page.getByText(/Add Medication|Add another Medication/i),
      ).toBeVisible();

      // Add medication
      await page.getByText(/Add Medication|Add another Medication/i).click();

      // Select medicine from list
      await page.getByRole("tab", { name: "Medication" }).click();
      await page.locator("input[data-slot='command-input']").fill(medicineName);
      await page.getByRole("option", { name: medicineName }).first().click();
      await expect(page.getByText(medicineName).first()).toBeVisible();

      // Fill medication details
      const dosageInput = page.getByPlaceholder("Enter a number...").first();
      await dosageInput.waitFor({ state: "visible" });
      await dosageInput.click();
      await dosageInput.fill(dosage);
      await expect(dosageInput).toHaveValue(dosage);
      await page.keyboard.press("Enter");

      await page.getByText("eg. 1-0-1").first().click();
      await page.getByPlaceholder("Type eg. 1-0-1").fill(frequency.input);
      await page
        .getByRole("option", { name: frequency.display })
        .nth(0)
        .click();

      // expand
      await page.getByTitle("Show Advanced Fields").first().click();

      await page
        .getByRole("button", { name: "No instructions selected" })
        .last()
        .click();
      await page.getByRole("option", { name: instruction }).click();

      // The medication's own notes field; a bare "Notes" placeholder also
      // matches inputs inside the instructions picker, which then stays open
      // over the Save button.
      await page
        .getByPlaceholder("Enter additional notes", { exact: true })
        .fill(notes);

      // Prescriptions are authored on the v2 fill page — its primary action
      // is "Save Changes" (see fill/FillHeader.tsx).
      await submitAndExpectSuccess(page);
    },
    { box: true },
  );

  return { medicineName, dosage, frequency, instruction, notes };
}
