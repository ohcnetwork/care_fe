import { type Page, expect } from "@playwright/test";
import { setTimeout as delay } from "node:timers/promises";
import { createTestPatient } from "tests/helper/patient";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";

/**
 * Fill-flow interaction helpers, targeting the v2 fill page (the one-scroll
 * form renderer). Everything scopes through `questionBlock` — the
 * `data-question-id` leaf block for an exact label — because the page also
 * renders every question title in the outline sidebar, so bare
 * `getByText(label)` matches twice.
 */

/**
 * Gives a fill test its own patient and response history. Sharing an
 * encounter lets concurrent tests change the values shown on Updates;
 * sharing a patient eventually hits the backend's active-encounter limit.
 */
export async function createQuestionnaireEncounter(
  facilityId: string,
): Promise<{ patientId: string; encounterId: string }> {
  const headers = adminApiHeaders();
  const patientId = await createTestPatient("Questionnaire Test");
  const encounterBody = JSON.stringify({
    patient: patientId,
    facility: facilityId,
    status: "in_progress",
    encounter_class: "amb",
    period: { start: new Date().toISOString() },
    priority: "routine",
    organizations: [],
  });
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${apiBaseUrl()}/api/v1/encounter/`, {
      method: "POST",
      headers,
      body: encounterBody,
    });
    if (response.ok) {
      const encounterId = ((await response.json()) as { id: string }).id;
      return { patientId, encounterId };
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
        `Failed to create questionnaire encounter: ${response.status} — ${error}`,
      );
    }
    await delay(250 * (attempt + 1));
  }
}

/**
 * Fills a string (single-line) input field identified by its label.
 */
export async function fillStringField(
  page: Page,
  labelText: string,
  value: string,
) {
  const block = questionBlock(page, labelText);
  await block.scrollIntoViewIfNeeded();
  await block.getByRole("textbox").fill(value);
}

/**
 * Clears a string input field identified by its label.
 */
export async function clearStringField(page: Page, labelText: string) {
  const block = questionBlock(page, labelText);
  await block.scrollIntoViewIfNeeded();
  await block.getByRole("textbox").clear();
}

/**
 * Asserts whether a question is on the canvas. Hidden (enable_when-false)
 * questions unmount entirely, so the assertion is on block count — a
 * visible label would also exist as an outline row, which this ignores.
 */
export async function checkVisibility(
  page: Page,
  labelText: string,
  shouldBeVisible: boolean,
) {
  const block = questionBlock(page, labelText);
  if (shouldBeVisible) {
    await expect(block).toBeVisible();
  } else {
    await expect(block).toHaveCount(0);
  }
}

/**
 * Clicks the submit button on the fill page ("Save Changes" per the
 * reference design).
 */
export async function submitForm(page: Page) {
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
}

/**
 * Asserts that a questionnaire field shows a validation error (the error
 * paragraphs render inside the question's block).
 */
export async function expectFieldError(page: Page, labelText: string) {
  await expect(
    questionBlock(page, labelText).locator("p.text-red-600"),
  ).toBeVisible();
}

/**
 * Submits the form and waits for the success toast.
 */
export async function submitAndExpectSuccess(page: Page) {
  await submitForm(page);
  await expectToast(page, /questionnaire submitted successfully/i);
}

/**
 * After submission, waits for navigation to the encounter updates page,
 * then asserts that `expectedValues` are visible and `excludedValues` are
 * NOT visible anywhere on the page.
 */
export async function verifySubmittedValues(
  page: Page,
  expectedValues: string[],
  excludedValues: string[] = [],
) {
  await page.waitForURL(/\/encounter\/[^/]+\/updates/);
  await page.waitForLoadState("networkidle");

  for (const val of expectedValues) {
    const locator = page.getByText(val, { exact: true }).first();
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
  }

  for (const val of excludedValues) {
    await expect(page.getByText(val, { exact: true })).not.toBeVisible();
  }
}

/**
 * Verifies that specific question labels have expected values on the overview page.
 * Scopes value assertion to the same row as the label, avoiding false positives
 * from generic values like "Yes"/"No" appearing elsewhere on the page. Answers
 * render as table rows, or as term/definition pairs in workspace panels.
 */
export async function verifyLabelledValues(
  page: Page,
  pairs: [label: string, value: string][],
) {
  await page.waitForURL(/\/encounter\/[^/]+\/updates/);
  await page.waitForLoadState("networkidle");

  for (const [label, value] of pairs) {
    const row = page
      .locator("tr, dl > div")
      .filter({ has: page.getByText(label, { exact: true }) })
      .first();
    await row.scrollIntoViewIfNeeded();
    await expect(row.locator("td, dd").last()).toHaveText(value);
  }
}

/**
 * Selects a boolean (Yes/No) option for a question identified by its label.
 * The v2 boolean input is a radiogroup of chips named "Yes"/"No".
 */
export async function selectBooleanOption(
  page: Page,
  labelText: string,
  option: "Yes" | "No",
) {
  const block = questionBlock(page, labelText);
  await block.scrollIntoViewIfNeeded();
  await block.getByRole("radio", { name: option, exact: true }).click();
}

/**
 * Clears a boolean selection by clicking the currently selected option again.
 * Only works when the question is not required (legacy RadioInput contract,
 * preserved by the v2 BooleanInput).
 */
export async function clearBooleanField(
  page: Page,
  labelText: string,
  currentOption: "Yes" | "No",
) {
  await selectBooleanOption(page, labelText, currentOption);
}
