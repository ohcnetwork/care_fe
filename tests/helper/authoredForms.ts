import { expect, type Page } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import {
  QUESTIONNAIRE_DETAIL_URL,
  openQuestionBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

/**
 * Author-then-consume flows: a questionnaire is built through the studio and
 * then checked where clinicians meet it — the encounter's Forms picker, the
 * fill page and the encounter's response tabs.
 */

export interface EncounterRef {
  facilityId: string;
  patientId: string;
  encounterId: string;
}

/** A fresh patient + encounter, so response assertions see only this test. */
export async function newEncounter(): Promise<EncounterRef> {
  const facilityId = getFacilityId();
  const { patientId, encounterId } =
    await createQuestionnaireEncounter(facilityId);
  return { facilityId, patientId, encounterId };
}

export function encounterPath({
  facilityId,
  patientId,
  encounterId,
}: EncounterRef) {
  return `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}`;
}

/** Creates an Active encounter questionnaire and opens its studio.
 *  Returns the questionnaire id. */
export async function authorActiveQuestionnaire(
  page: Page,
  title: string,
): Promise<string> {
  await page.goto(`/facility/${getFacilityId()}/settings/questionnaires/new`);
  await page.getByRole("textbox", { name: "Title" }).pressSequentially(title);
  // Parallel repeats can share a Date.now() title; a slug clash is a 500.
  await page
    .getByRole("textbox", { name: "Slug" })
    .fill(`qv2-${crypto.randomUUID().slice(0, 13)}`);
  await page
    .getByRole("radiogroup", { name: "Status" })
    .getByRole("radio", { name: "Active" })
    .click();
  await page.getByRole("button", { name: "Save Questionnaire" }).click();
  await expectToast(page, "Questionnaire created successfully");
  await page.waitForURL(QUESTIONNAIRE_DETAIL_URL);
  const id = page.url().split("/").pop()!;
  await openQuestionBuilder(page);
  return id;
}

/** The studio's own Import Questions flow (file dropzone). */
export async function importQuestionsInStudio(
  page: Page,
  questions: object[],
): Promise<void> {
  await page.getByRole("button", { name: "Import Questions" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "questions.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ questions })),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expectToast(page, "Questionnaire Imported Successfully");
}

/** Picks an answer type for the selected question by its type token; the
 *  option names include description text, so the cmdk value is the hook. */
export async function pickQuestionType(page: Page, type: string) {
  await page.getByRole("combobox").first().click();
  await page
    .locator(`[data-slot="command-item"][data-value="${type}"]`)
    .click();
}

export async function selectInOutline(page: Page, title: string) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: title })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Question Title" }),
  ).toHaveValue(title);
}

export async function saveStudio(page: Page) {
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expectToast(page, "Questionnaire updated successfully");
}

/** Opens `title` from the encounter overview's Forms picker, the way a
 *  clinician starts a form, and waits for the fill page. */
export async function openFormFromEncounter(
  page: Page,
  encounter: EncounterRef,
  title: string,
) {
  await page.goto(`${encounterPath(encounter)}/updates`);
  await page.getByRole("button", { name: "Forms" }).click();
  const picker = page.getByRole("dialog");
  await picker.getByPlaceholder("Search Forms").fill(title);
  await picker.getByRole("option").filter({ hasText: title }).click();
  await page.waitForURL(/\/questionnaire\/[0-9a-f-]+$/);
}
