import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

import { expectToast } from "./ui";

/** Deterministic fixtures seeded by the setup project
 *  (tests/support/questionnaireE2EFixtures.ts). */
export const KITCHEN_SINK_FACILITY_SLUG = "e2e-kitchen-sink-facility";
export const KITCHEN_SINK_INSTANCE_SLUG = "e2e-kitchen-sink-instance";
export const VERSIONED_SLUG = "e2e-versioned";
/** 18 records named `E2E Pagination 001..018`, facility-scoped, active. */
export const PAGINATION_TITLE_PREFIX = "E2E Pagination";
export const PAGINATION_FIXTURE_COUNT = 18;

/** Reads the admin bearer token captured by tests/setup/auth.setup.ts. */
export function adminApiHeaders(): Record<string, string> {
  const authFile = path.resolve("tests/.auth/user.json");
  const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const localStorage: { name: string; value: string }[] =
    storageState.origins?.[0]?.localStorage ?? [];
  const token = localStorage.find(
    (item) => item.name === "care_access_token",
  )?.value;
  if (!token) {
    throw new Error("No access token in tests/.auth/user.json — run setup");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function apiBaseUrl(): string {
  return process.env.REACT_CARE_API_URL || "http://localhost:9000";
}

const slugCache = new Map<string, string>();

/**
 * Resolves a fixture questionnaire's id from its slug. The detail endpoint
 * looks up by external_id only (slug lookup is not supported) and the list
 * has no slug filter, so this lists broadly and matches client-side.
 */
export async function getQuestionnaireIdBySlug(slug: string): Promise<string> {
  const cached = slugCache.get(slug);
  if (cached) return cached;

  const limit = 100;
  let offset = 0;

  while (true) {
    const res = await fetch(
      `${apiBaseUrl()}/api/v1/questionnaire/?limit=${limit}&offset=${offset}`,
      {
        headers: adminApiHeaders(),
      },
    );
    if (!res.ok) {
      throw new Error(`Failed to list questionnaires: ${res.status}`);
    }
    const data = (await res.json()) as {
      results: { id: string; slug: string }[];
    };

    // Cache and check all results on this page
    for (const entry of data.results) {
      slugCache.set(entry.slug, entry.id);
      if (entry.slug === slug) {
        return entry.id;
      }
    }

    // If we got fewer results than the limit, we've reached the end
    if (data.results.length < limit) {
      break;
    }

    offset += limit;
  }

  throw new Error(
    `Fixture questionnaire "${slug}" not found — run the Playwright setup project`,
  );
}

/** Matches the questionnaire v2 detail URL on both mounts
 *  (`/facility/{id}/settings/questionnaires/{uuid}` and
 *  `/admin/questionnaires/{uuid}`). */
export const QUESTIONNAIRE_DETAIL_URL = /\/questionnaires\/[0-9a-f-]+$/;

export interface CreateQuestionnaireOptions {
  /** Mount base path, e.g. `/facility/${facilityId}/settings/questionnaires`
   *  or `/admin/questionnaires`. */
  basePath: string;
  /** Generate unique titles per PLAYWRIGHT_GUIDE (faker/Date.now). */
  title: string;
  /** Status radio to pick before saving (display label); default Draft. */
  status?: "Active" | "Draft" | "Retired";
}

/**
 * Drives the v2 create form end-to-end: open `${basePath}/new`, type the
 * title, submit, wait for the created toast and the detail-page redirect.
 * Returns the detail page URL.
 */
export async function createQuestionnaire(
  page: Page,
  { basePath, title, status }: CreateQuestionnaireOptions,
): Promise<string> {
  await page.goto(`${basePath}/new`);
  await page.getByRole("textbox", { name: "Title" }).pressSequentially(title);
  if (status) {
    await page
      .getByRole("radiogroup", { name: "Status" })
      .getByRole("radio", { name: status })
      .click();
  }
  await page.getByRole("button", { name: "Save Questionnaire" }).click();
  await expectToast(page, "Questionnaire created successfully");
  await page.waitForURL(QUESTIONNAIRE_DETAIL_URL);
  return page.url();
}

/** From the detail page, opens the question builder (`…/{id}/edit`). */
export async function openQuestionBuilder(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Edit Questions" }).click();
  await page.waitForURL(/\/edit$/);
}

/** createQuestionnaire + openQuestionBuilder; returns the detail page URL. */
export async function createQuestionnaireAndOpenBuilder(
  page: Page,
  options: CreateQuestionnaireOptions,
): Promise<string> {
  const detailUrl = await createQuestionnaire(page, options);
  await openQuestionBuilder(page);
  return detailUrl;
}

/**
 * Switches the questionnaire list's status filter. Each tab's radio is
 * visually hidden inside its label, so the label is what takes the click.
 */
export async function selectQuestionnaireStatusTab(
  page: Page,
  status: "Active" | "Draft" | "Retired",
): Promise<void> {
  await page
    .getByRole("radiogroup", { name: "Status" })
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: status, exact: true }) })
    .click();
}

/**
 * Picks a valueset in the builder's SelectOrCreateValueset autocomplete.
 * The search box (Autocomplete's Base UI combobox input) only renders while
 * the picker — a popover, or a drawer on mobile — is open, so the strict
 * role + name locator can only resolve to the opened picker's input.
 */
export async function pickValuesetFromAutocomplete(
  page: Page,
  { search, optionName }: { search: string; optionName: string },
): Promise<void> {
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select a value set" })
    .click();
  await page
    .getByRole("combobox", { name: "Search option...", exact: true })
    .fill(search);
  await page.getByRole("option", { name: optionName }).click();
  await expect(
    page.getByRole("combobox").filter({ hasText: optionName }),
  ).toBeVisible();
}

/**
 * The canvas block for one LEAF question on the one-scroll form renderer,
 * anchored on the `data-question-id` attribute the renderer stamps and the
 * question's exact label text. The whole questionnaire renders on one
 * scroll, so bare role queries (`spinbutton`, `Add note`, `textarea`) match
 * every question at once — scope them through this instead.
 *
 * Leaf blocks only (the `hasNot` filter drops enclosing section cards,
 * which would also satisfy `has:` through their children) and exact label
 * matching, so strict mode stays armed: two questions sharing a label fail
 * loudly instead of silently resolving to whichever renders last. Assert
 * the block's count (`toHaveCount(1)`) before building any negative
 * assertion on it — a zero-match locator passes `.not.` checks vacuously.
 */
/**
 * Clicks a question's label on the builder edit canvas. Playwright retargets a
 * label click to its control, which is inert on the edit canvas, so click the
 * card at the label's position instead.
 */
export async function clickCanvasQuestionLabel(block: Locator) {
  const label = block.locator("label").first();
  const [blockBox, labelBox] = await Promise.all([
    block.boundingBox(),
    label.boundingBox(),
  ]);
  if (!blockBox || !labelBox) throw new Error("Question label is not visible");
  await block.click({
    position: {
      x: labelBox.x - blockBox.x + Math.min(8, labelBox.width / 2),
      y: labelBox.y - blockBox.y + labelBox.height / 2,
    },
  });
}

export function questionBlock(page: Page, label: string) {
  return page
    .locator("[data-question-id]")
    .filter({ hasNot: page.locator("[data-question-id]") })
    .filter({
      has: page.locator(
        `xpath=.//label[normalize-space(.)=${JSON.stringify(label)}]`,
      ),
    });
}

/**
 * Appends a top-level question and types its title. On an empty form the
 * canvas shows "Add First Question"; once questions exist, several controls
 * carry the "Add new question" name (outline separators and footer, the
 * canvas append zone, the mobile button) — the canvas zone is addressed via
 * the labeled "Form canvas" region instead of a DOM-order-dependent
 * `.last()`.
 */
export async function addTopLevelQuestion(
  page: Page,
  title: string,
): Promise<void> {
  const addFirst = page.getByRole("button", { name: "Add First Question" });
  if (await addFirst.isVisible().catch(() => false)) {
    await addFirst.click();
  } else {
    await page
      .getByRole("region", { name: "Form canvas" })
      .getByRole("button", { name: "Add new question" })
      .click();
  }
  await page
    .getByRole("textbox", { name: "Question Title" })
    .pressSequentially(title);
}

// ---------------------------------------------------------------------------
// Capability steps (UI) and seeders (API) for questionnaire authoring.
// ---------------------------------------------------------------------------

/** A question in a builder import file or an API create body. `id` is
 *  filled in by the API seeders when omitted. */
export interface QuestionnaireQuestionInput {
  text: string;
  type: string;
  link_id: string;
  id?: string;
  questions?: QuestionnaireQuestionInput[];
  [key: string]: unknown;
}

/** Imports a question tree into the open builder through the file dropzone
 *  and waits for the import toast — faster than authoring click-by-click. */
export async function importQuestionsViaUi(
  page: Page,
  {
    questions,
    fileName = "scaffold.json",
  }: { questions: object[]; fileName?: string },
): Promise<void> {
  await test.step(
    "questionnaire.author.import",
    async () => {
      await page.getByRole("button", { name: "Import Questions" }).click();
      await page.locator('input[type="file"]').setInputFiles({
        name: fileName,
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify({ questions })),
      });
      await page.getByRole("button", { name: "Import", exact: true }).click();
      await expectToast(page, "Questionnaire Imported Successfully");
    },
    { box: true },
  );
}

/** Imports flat string questions (link ids `q-0`, `q-1`, …) into the open
 *  builder. */
export async function importStringQuestionsViaUi(
  page: Page,
  { titles }: { titles: string[] },
): Promise<void> {
  await importQuestionsViaUi(page, {
    questions: titles.map((text, index) => ({
      text,
      type: "string",
      link_id: `q-${index}`,
    })),
  });
}

/**
 * Picks a question type for the selected question by its type token (e.g.
 * "date", "quantity"). The option's accessible name includes the description
 * sentence, which makes label matching ambiguous ("Date" is a substring of
 * "Date Time…"), so the cmdk item's data-value is the only unambiguous hook.
 * The type picker is the first combobox in the editor card. `filter` types
 * the token into the picker first — the unfiltered popover can overflow the
 * viewport, leaving low entries (like quantity) unclickable. "group" also
 * picks the "Simple Group" variant.
 */
export async function pickQuestionType(
  page: Page,
  { type, filter = false }: { type: string; filter?: boolean },
): Promise<void> {
  await page.getByRole("combobox").first().click();
  if (filter) {
    await page.locator('[data-slot="command-input"]').last().fill(type);
  }
  await page
    .locator(`[data-slot="command-item"][data-value="${type}"]`)
    .click();
  if (type === "group") {
    await page
      .getByRole("option", { name: "Simple Group", exact: true })
      .click();
  }
}

/** Appends a top-level question in the open builder, types its title and
 *  optionally picks its type (see `pickQuestionType`). */
export async function addQuestionViaUi(
  page: Page,
  { title, type }: { title: string; type?: string },
): Promise<{ title: string }> {
  await test.step(
    "questionnaire.author.question.add",
    async () => {
      // addTopLevelQuestion branches on an instant visibility check, so wait
      // until the builder has rendered one of its two add affordances.
      await expect(
        page
          .getByRole("button", { name: "Add First Question" })
          .or(
            page
              .getByRole("region", { name: "Form canvas" })
              .getByRole("button", { name: "Add new question" }),
          )
          .first(),
      ).toBeVisible();
      await addTopLevelQuestion(page, title);
      if (type) await pickQuestionType(page, { type });
    },
    { box: true },
  );

  return { title };
}

/** Clicks the builder's Save Changes and waits for the success toast. */
export async function saveQuestionnaireBuilderViaUi(page: Page): Promise<void> {
  await test.step(
    "questionnaire.author.save",
    async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    },
    { box: true },
  );
}

/** Creates a questionnaire through the v2 create form (facility mount when
 *  `facilityId` is given, admin mount otherwise) and lands on its detail
 *  page. */
export async function createQuestionnaireViaUi(
  page: Page,
  {
    facilityId,
    title,
    status,
  }: {
    facilityId?: string;
    title: string;
    status?: CreateQuestionnaireOptions["status"];
  },
): Promise<{ questionnaireId: string; detailUrl: string }> {
  return await test.step(
    "questionnaire.author.create",
    async () => {
      const basePath = facilityId
        ? `/facility/${facilityId}/settings/questionnaires`
        : "/admin/questionnaires";
      const detailUrl = await createQuestionnaire(page, {
        basePath,
        title,
        status,
      });
      const questionnaireId = new URL(detailUrl).pathname.split("/").pop()!;
      return { questionnaireId, detailUrl };
    },
    { box: true },
  );
}

/** Opens a questionnaire's detail page, clones it through the Clone
 *  Questionnaire dialog and waits for the new draft's detail page. */
export async function cloneQuestionnaireViaUi(
  page: Page,
  {
    facilityId,
    questionnaireId,
  }: { facilityId?: string; questionnaireId: string },
): Promise<{ questionnaireId: string }> {
  return await test.step(
    "questionnaire.author.clone",
    async () => {
      const basePath = facilityId
        ? `/facility/${facilityId}/settings/questionnaires`
        : "/admin/questionnaires";
      await page.goto(`${basePath}/${questionnaireId}`);
      await page.getByRole("button", { name: "Clone Questionnaire" }).click();
      const dialog = page.getByRole("dialog", { name: "Clone Questionnaire" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Clone Questionnaire" }).click();
      await expectToast(page, "Questionnaire cloned successfully");
      // The source detail URL already matches the detail pattern — wait for
      // the URL to change to a different questionnaire id.
      await page.waitForURL(
        (url) =>
          QUESTIONNAIRE_DETAIL_URL.test(url.pathname) &&
          !url.pathname.endsWith(`/${questionnaireId}`),
      );
      return {
        questionnaireId: new URL(page.url()).pathname.split("/").pop()!,
      };
    },
    { box: true },
  );
}

/** Opens a fixture questionnaire (by slug) straight into the builder's
 *  preview mode on the facility mount. */
export async function openQuestionnairePreview(
  page: Page,
  { facilityId, slug }: { facilityId: string; slug: string },
): Promise<void> {
  const id = await getQuestionnaireIdBySlug(slug);
  await page.goto(
    `/facility/${facilityId}/settings/questionnaires/${id}/edit?mode=preview`,
  );
  await expect(page.getByRole("navigation")).toBeVisible();
}

/** Jumps to a top-level question via the builder/renderer tree nav. */
export async function jumpToQuestion(
  page: Page,
  questionText: string,
): Promise<void> {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: questionText })
    .click();
}

/** Collects the URLs of PUTs to the questionnaire update endpoint from the
 *  moment it is called. */
export function trackQuestionnairePutRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "PUT" &&
      /\/api\/v1\/questionnaire\/[^/]+\/$/.test(new URL(request.url()).pathname)
    ) {
      requests.push(request.url());
    }
  });
  return requests;
}

interface CreateQuestionnaireViaApiOptions {
  /** Defaults to a unique `E2E Questionnaire …` title. */
  title?: string;
  /** Defaults to a unique slug. */
  slug?: string;
  status?: "active" | "draft" | "retired";
  subjectType?:
    "patient" | "encounter" | "referral" | "location" | "device" | "facility";
  /** Defaults to one optional string question. */
  questions?: QuestionnaireQuestionInput[];
}

function withQuestionIds(
  questions: QuestionnaireQuestionInput[],
): QuestionnaireQuestionInput[] {
  return questions.map((question) => ({
    ...question,
    id: question.id ?? faker.string.uuid(),
    ...(question.questions
      ? { questions: withQuestionIds(question.questions) }
      : {}),
  }));
}

async function postQuestionnaire(
  {
    title = `E2E Questionnaire ${faker.string.alphanumeric(8)}`,
    slug = `e2e-q-${faker.string.alphanumeric(10).toLowerCase()}`,
    status = "active",
    subjectType = "encounter",
    questions = [{ text: "Note", type: "string", link_id: "note" }],
  }: CreateQuestionnaireViaApiOptions,
  scope: Record<string, unknown>,
): Promise<{ questionnaireId: string; slug: string; title: string }> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      title,
      slug,
      description: "",
      version: "1.0",
      status,
      subject_type: subjectType,
      actions: [],
      questions: withQuestionIds(questions),
      ...scope,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to create questionnaire: ${res.status} — ${await res.text()}`,
    );
  }
  const created = (await res.json()) as { id: string };
  return { questionnaireId: created.id, slug, title };
}

/** Creates an instance-scoped questionnaire (no organization grants) through
 *  the API as the admin. */
export async function createInstanceQuestionnaireViaApi(
  options: CreateQuestionnaireViaApiOptions & { organizations?: string[] } = {},
): Promise<{ questionnaireId: string; slug: string; title: string }> {
  return postQuestionnaire(options, {
    auth_context: "instance",
    organizations: options.organizations ?? [],
  });
}

/** Creates a facility-scoped questionnaire through the API as the admin
 *  (patient subject type is instance-only). */
export async function createFacilityQuestionnaireViaApi({
  facilityId,
  ...options
}: CreateQuestionnaireViaApiOptions & { facilityId: string }): Promise<{
  questionnaireId: string;
  slug: string;
  title: string;
}> {
  return postQuestionnaire(options, {
    auth_context: "facility",
    facility: facilityId,
  });
}
