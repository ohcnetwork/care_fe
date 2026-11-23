import { faker } from "@faker-js/faker";
import {
  type Page,
  type Request,
  type Response,
  expect,
  test,
} from "@playwright/test";
import { createTestEncounter } from "tests/helper/encounter";
import { createTestPatient } from "tests/helper/patient";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
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
  {
    status = "in_progress",
    encounterClass = "amb",
    start = new Date(),
    organizations = [],
  }: {
    status?: "in_progress" | "planned";
    encounterClass?: "amb" | "imp";
    start?: Date;
    organizations?: string[];
  } = {},
): Promise<{ patientId: string; encounterId: string }> {
  const patientId = await createTestPatient("Questionnaire Test");
  const encounterId = await createTestEncounter(facilityId, patientId, {
    status,
    encounterClass,
    period: { start: start.toISOString() },
    organizations,
  });
  return { patientId, encounterId };
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
    await expect(page.getByText(val, { exact: true })).toBeHidden();
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

/**
 * Slugs of the fixed structured pseudo-questionnaires (`FIXED_QUESTIONNAIRES`
 * in StructuredFormData). The fill route takes these slugs as-is; every
 * other questionnaire is addressed by id.
 */
export const FIXED_QUESTIONNAIRE_SLUGS = [
  "symptom",
  "diagnosis",
  "procedure",
  "allergy_intolerance",
  "medication_request",
  "medication_statement",
  "service_request",
  "encounter",
  "files",
  "time_of_death",
  "charge_item",
  "appointment",
] as const;

export interface QuestionnaireFillTarget {
  facilityId: string;
  patientId: string;
  /** Omit for the patient-subject mount (`/patient/:id/questionnaire/…`). */
  encounterId?: string;
  /** A fixed structured slug (`diagnosis`) or a seeded fixture slug
   *  (`respiratory_status-v3`). Ignored when `questionnaireId` is given. */
  slug?: string;
  /** The questionnaire's id, when the caller already has it. */
  questionnaireId?: string;
  /** Extra query string, e.g. `{ prescription: id }`. */
  query?: Record<string, string>;
}

/** Path of the fill page for one questionnaire on an encounter or patient. */
export function questionnaireFillPath({
  facilityId,
  patientId,
  encounterId,
  questionnaireId,
  query,
}: Omit<QuestionnaireFillTarget, "slug"> & { questionnaireId: string }) {
  const subject = encounterId
    ? `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}`
    : `/facility/${facilityId}/patient/${patientId}`;
  const search = query ? `?${new URLSearchParams(query)}` : "";
  return `${subject}/questionnaire/${questionnaireId}${search}`;
}

/**
 * Opens the fill page for a questionnaire and waits for its Save Changes
 * action. Fixture slugs are resolved to ids (the fill route has no slug
 * lookup); fixed structured slugs are used as-is.
 */
export async function openQuestionnaireFillViaUi(
  page: Page,
  target: QuestionnaireFillTarget,
): Promise<{ questionnaireId: string; fillUrl: string }> {
  return test.step(
    "questionnaire.fill.open",
    async () => {
      const { slug } = target;
      let questionnaireId = target.questionnaireId;
      if (!questionnaireId) {
        if (!slug) throw new Error("Pass a questionnaire slug or id");
        questionnaireId = (
          FIXED_QUESTIONNAIRE_SLUGS as readonly string[]
        ).includes(slug)
          ? slug
          : await getQuestionnaireIdBySlug(slug);
      }
      const fillUrl = questionnaireFillPath({ ...target, questionnaireId });
      await page.goto(fillUrl);
      await expect(
        page.getByRole("button", { name: "Save Changes", exact: true }),
      ).toBeVisible();
      return { questionnaireId, fillUrl };
    },
    { box: true },
  );
}

/** Submits the open fill session and waits for the success toast. */
export async function submitQuestionnaireViaUi(page: Page): Promise<void> {
  await test.step(
    "questionnaire.fill.submit",
    async () => {
      await submitAndExpectSuccess(page);
    },
    { box: true },
  );
}

export interface CreateQuestionnaireViaApiInput {
  questions: object[];
  /** Defaults to a unique `E2E Questionnaire …` title. */
  title?: string;
  /** Defaults to a unique slug. */
  slug?: string;
  status?: "active" | "draft" | "retired";
  subjectType?: "encounter" | "patient";
  /** Facility scope; omit for an instance questionnaire. */
  facilityId?: string;
  version?: string;
  description?: string;
  organizations?: string[];
  actions?: object[];
}

/**
 * Creates a questionnaire through the API (admin bearer). Only the fields
 * passed are sent, so a caller reproduces exactly the payload it needs.
 */
export async function createQuestionnaireViaApi({
  questions,
  title,
  slug,
  status = "active",
  subjectType = "encounter",
  facilityId,
  version,
  description,
  organizations,
  actions,
}: CreateQuestionnaireViaApiInput): Promise<{
  id: string;
  slug: string;
  title: string;
}> {
  const suffix = faker.string.alphanumeric(12).toLowerCase();
  const body = {
    title: title ?? `E2E Questionnaire ${suffix}`,
    slug: slug ?? `e2e-questionnaire-${suffix}`,
    status,
    subject_type: subjectType,
    auth_context: facilityId ? "facility" : "instance",
    ...(facilityId ? { facility: facilityId } : {}),
    ...(version !== undefined ? { version } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(organizations !== undefined ? { organizations } : {}),
    questions,
    ...(actions !== undefined ? { actions } : {}),
  };
  const response = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create questionnaire: ${response.status} — ${await response.text()}`,
    );
  }
  const created = (await response.json()) as { id: string };
  return { id: created.id, slug: body.slug, title: body.title };
}

/**
 * Adds another questionnaire to the open fill session through the
 * "Add questionnaire" picker.
 *
 * The picker's search box is an uncontrolled cmdk input: the component only
 * resets its OWN `search` state on reopen (QuestionnaireSearch.tsx's
 * handleOpenChange), not the input's DOM value. On a SECOND open within one
 * page session that value can already read the search term, and `fill()` on
 * an already-matching value doesn't reliably re-fire the input event React
 * listens on — so it clears first, types key by key, and waits for the
 * option before clicking it.
 */
export async function addQuestionnaireViaUi(
  page: Page,
  { search, title }: { search: string; title: RegExp | string },
): Promise<void> {
  await test.step(
    "questionnaire.fill.multi-form.add",
    async () => {
      await page.getByRole("button", { name: "Add questionnaire" }).click();
      const searchBox = page.getByPlaceholder("Search Forms");
      await searchBox.fill("");
      await searchBox.pressSequentially(search);
      await expect(page.getByRole("option", { name: title })).toBeVisible();
      await page.getByRole("option", { name: title }).click();
    },
    { box: true },
  );
}

/** Answers the two required questions of the `respiratory_status-v3` fixture. */
export async function answerRespiratoryStatusRequired(page: Page) {
  await questionBlock(page, "Is bilateral air entry present?")
    .getByRole("radio", { name: "yes", exact: true })
    .click();
  await questionBlock(page, "Select Modality")
    .getByRole("radio", { name: "oxygen_support", exact: true })
    .click();
}

function isBatchPost(request: Request) {
  return (
    request.url().includes("/api/v1/batch_requests/") &&
    request.method() === "POST"
  );
}

/**
 * Resolves with the next submit batch POST (`/api/v1/batch_requests/`).
 * Call it BEFORE the click that sends the batch.
 */
export function waitForBatchRequest(page: Page): Promise<Request> {
  return page.waitForRequest(isBatchPost);
}

/** Resolves with the response to the next submit batch POST. */
export function waitForBatchResponse(page: Page): Promise<Response> {
  return page.waitForResponse((response) => isBatchPost(response.request()));
}

/**
 * Records the URL of every batch POST from the moment it's called —
 * registering the listener AFTER an action would only prove no request had
 * arrived YET, not that the action never sends one.
 */
export function trackBatchRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/batch_requests/")
    ) {
      urls.push(request.url());
    }
  });
  return urls;
}
