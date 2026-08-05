import { faker } from "@faker-js/faker";
import { type Locator, type Page, expect, test } from "@playwright/test";
import { format, subHours } from "date-fns";
import { submitForm } from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import {
  STRUCTURED_FIXTURES,
  structuredFixtureUrl,
} from "tests/helper/structuredFixtures";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Cross-type structured-question invariants. These tests pin shared behavior,
 * not one type, so a new structured type that breaks an invariant fails here
 * with a name that describes the behavior.
 *
 * `encounter` prefetches a real server row while the other structured fixtures
 * are create-only, making it the fixture that verifies passive server reads do
 * not become clinician edits.
 */

const encounterFixture = STRUCTURED_FIXTURES.encounter;
const timeOfDeathFixture = STRUCTURED_FIXTURES.time_of_death;

/** The Select/Input control immediately following a `<Label>` whose text
 *  CONTAINS `labelText` — mirrors `encounterStructured.spec.ts`'s identical
 *  helper for the same widget (neither `<Select>`/`<Label>` here uses
 *  `htmlFor`, so `getByLabel` cannot find these). */
function fieldControl(
  block: Locator,
  labelText: string,
  tag: "button" | "input" = "button",
) {
  return block.locator(
    `xpath=.//label[contains(normalize-space(.), ${JSON.stringify(labelText)})]/following-sibling::${tag}[1]`,
  );
}

function trackBatchRequests(page: Page): { url: string; body: string }[] {
  const seen: { url: string; body: string }[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/batch_requests/")
    ) {
      seen.push({ url: request.url(), body: request.postData() ?? "{}" });
    }
  });
  return seen;
}

/** How many fill-session drafts this origin currently holds — mirrors
 *  `fillAutosave.spec.ts`'s own private helper. */
async function fillDraftCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("care_qn_fill_draft--"),
      ).length,
  );
}

/** The stored (single) fill draft's `forms` content this origin holds — the
 *  part that actually reflects clinician edits — or `undefined` if there is
 *  no draft. Deliberately excludes the stored `savedAt` timestamp: a
 *  content-free persist (e.g. one incidentally scheduled around the same
 *  moment as the test's own network toggle, for a reason unrelated to this
 *  invariant) legitimately re-stamps `savedAt` on every write regardless of
 *  whether anything changed — that is `saveFillDraft`'s own, unrelated
 *  contract, not a spurious rewrite this invariant means to catch. What
 *  this invariant actually guards is `forms` (the safe partition +
 *  `structuredSkipped` flag): a background refetch must never rewrite ITS
 *  content. */
async function soleDraftForms(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) =>
      k.startsWith("care_qn_fill_draft--"),
    );
    if (!key) return undefined;
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.stringify((JSON.parse(raw) as { forms: unknown }).forms);
  });
}

/** A datetime-local value safely in the past (mirrors
 *  `timeOfDeath.spec.ts`'s identical helper). */
function pastDateTimeLocal(hoursAgo: number): string {
  return format(subHours(new Date(), hoursAgo), "yyyy-MM-dd'T'HH:mm");
}

test.describe("Structured invariant 1: zero upsert for an untouched section", () => {
  // Both tests below submit against the ONE shared fixture encounter
  // (`getEncounterId()`, via `structuredFixtureUrl`) — serial, same reason
  // `encounterStructured.spec.ts` serialises its own describe: keeps this
  // file's two submits from racing each other's edits on that one row.
  test.describe.configure({ mode: "serial" });

  test("an untouched encounter section produces ZERO upsert requests, even though it prefetched (P1-14)", async ({
    page,
  }) => {
    const batches = trackBatchRequests(page);
    const questionnaireId = await getQuestionnaireIdBySlug(
      encounterFixture.slug,
    );
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, encounterFixture.label);
    await expect(block).toBeVisible();
    // The prefetch landed — the status combobox only carries a value once
    // the fetch resolved (mirrors `fillAutosave.spec.ts:206`'s identical
    // proof for this same fixed pseudo-questionnaire).
    const statusTrigger = fieldControl(block, "Encounter Status");
    await expect(statusTrigger).toBeVisible();
    await expect(statusTrigger).not.toHaveText("Select Status");

    // Touch NOTHING in the encounter section. Answer the unrelated plain
    // question only, so the overall submit has content to send at all
    // (`useSubmitFillSession.ts`'s own `requests.length === 0` guard would
    // otherwise block Save for an unrelated reason and leave nothing here
    // to inspect).
    await questionBlock(page, "Plain note")
      .getByRole("textbox")
      .fill(faker.lorem.words(3));

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await submitForm(page);
    await expectToast(page, /questionnaire submitted successfully/i);
    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: { url: string }[];
    };
    expect(
      body.requests.some((r) => r.url.includes("/api/v1/encounter/")),
      "an untouched encounter section must never PUT — the legacy definition PUT unconditionally on every submit and could never make this guarantee",
    ).toBe(false);
    expect(batches.length).toBeGreaterThan(0);
  });

  test("cross-check: touching one field on the SAME type produces exactly one encounter upsert", async ({
    page,
  }) => {
    // Guards against the previous test passing for the WRONG reason — a
    // spec that always sees zero matching requests because nothing about
    // this differ ever fires at all would pass the negative case vacuously.
    const questionnaireId = await getQuestionnaireIdBySlug(
      encounterFixture.slug,
    );
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, encounterFixture.label);
    await expect(block).toBeVisible();

    // A plain text field, overwritten unconditionally with a fresh random
    // value — unlike a Select edit, this never needs to read "whatever is
    // currently selected" first, so it carries no read-then-write race
    // against a concurrently-running spec touching the same shared
    // encounter (e.g. `encounterStructured.spec.ts`'s own Status/Priority
    // edit test).
    const hospitalIdInput = fieldControl(block, "Hospital Identifier", "input");
    await hospitalIdInput.fill(faker.string.alphanumeric(10));

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await submitForm(page);
    await expectToast(page, /questionnaire submitted successfully/i);
    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: { url: string }[];
    };
    const encounterPuts = body.requests.filter((r) =>
      r.url.includes("/api/v1/encounter/"),
    );
    expect(
      encounterPuts,
      "exactly one encounter PUT for a genuinely touched section",
    ).toHaveLength(1);
  });
});

test("Structured invariant 2: a background refetch never creates dirty state, never writes a draft, and never clobbers an in-progress edit elsewhere on the form", async ({
  page,
}) => {
  const questionnaireId = await getQuestionnaireIdBySlug(encounterFixture.slug);
  await page.goto(structuredFixtureUrl(questionnaireId));

  const block = questionBlock(page, encounterFixture.label);
  await expect(block).toBeVisible();
  const statusTrigger = fieldControl(block, "Encounter Status");
  await expect(statusTrigger).not.toHaveText("Select Status");
  const statusBefore = (await statusTrigger.innerText()).trim();
  const priorityBefore = (
    await fieldControl(block, "Priority").innerText()
  ).trim();

  // Type into a PLAIN question — never touch the structured section itself.
  const note = faker.lorem.sentence();
  const noteInput = questionBlock(page, "Plain note").getByRole("textbox");
  await noteInput.fill(note);
  await expect(page.getByRole("tab", { name: /Questionnaire/ })).toContainText(
    "Draft",
  );

  // Let the debounce settle so there is a real, stable draft on disk to
  // compare against after the refetch.
  await expect.poll(() => fillDraftCount(page), { timeout: 5000 }).toBe(1);
  const formsBefore = await soleDraftForms(page);
  expect(formsBefore).toBeTruthy();

  // Force a REAL background refetch of the encounter query without a page
  // reload (`page.reload()` is a fresh mount, not a refetch — it would
  // trip the draft-restore-bar path instead of the one this invariant
  // means to pin). TanStack Query's `refetchOnReconnect` defaults to
  // `true` (only `refetchOnWindowFocus` is disabled app-wide,
  // `Utils/request/queryClient.ts`) — toggling the browser's network state
  // fires the same 'online' event a real, transient connectivity blip
  // would, and the currently-mounted `["encounter", encounterId]` query
  // (staleTime 0, the default) refetches in the background exactly as it
  // would in production.
  const refetch = page.waitForResponse(
    (response) =>
      /\/api\/v1\/encounter\/[^/]+\/(\?.*)?$/.test(response.url()) &&
      response.request().method() === "GET",
  );
  await page.context().setOffline(true);
  await page.context().setOffline(false);
  await refetch;

  // The unrelated, in-progress plain-note edit survived the refetch
  // untouched — the race the baseline/edits split exists to end.
  await expect(noteInput).toHaveValue(note);
  // The structured section itself reads exactly as the fresh prefetch
  // supplied — neither blanked nor drifted by the refetch.
  await expect(statusTrigger).toHaveText(statusBefore);
  await expect(fieldControl(block, "Priority")).toHaveText(priorityBefore);
  // Still dirty from the ORIGINAL plain-note edit — a refetch elsewhere on
  // the form must never silently clear it.
  await expect(page.getByRole("tab", { name: /Questionnaire/ })).toContainText(
    "Draft",
  );

  // No SPURIOUS autosave rewrite: the refetch rewrites the structured
  // question's `values` (its projection), but `draftResponseForStorage`
  // strips that projection down to the edit log before storage, and the
  // edit log itself never changed (nothing was edited) — so the stored
  // draft's actual CONTENT must be identical to what it was before the
  // refetch, past the debounce window either way. (Not a raw byte
  // comparison of the whole stored record: `savedAt` legitimately
  // re-stamps on every persist, content-changing or not — see
  // `soleDraftForms`'s own doc comment.)
  await page.waitForTimeout(2000);
  const formsAfter = await soleDraftForms(page);
  expect(formsAfter).toBe(formsBefore);
});

test("Structured invariant 3: a structured-only edit arms the unsaved-changes prompt and produces a restorable draft (P1-3)", async ({
  page,
}) => {
  // Under v1 a structured-only session (no plain answer touched at all)
  // was invisible to BOTH dirty tracking and drafts — `time_of_death`
  // carried a blanket `draftPolicy: "exclude"` (D2's predecessor). Contract
  // v2 makes it `"serialize"` (`definitions/timeOfDeath.tsx`), so this is a
  // genuinely NEW capability, not a regression guard.
  const questionnaireId = await getQuestionnaireIdBySlug(
    timeOfDeathFixture.slug,
  );
  const fillUrl = structuredFixtureUrl(questionnaireId);
  await page.goto(fillUrl);

  const block = questionBlock(page, timeOfDeathFixture.label);
  await expect(block).toBeVisible();
  const input = block.getByLabel(timeOfDeathFixture.label, { exact: true });

  // ONLY the structured datetime — the plain "Plain note" question is left
  // completely untouched.
  const value = pastDateTimeLocal(4);
  await input.fill(value);
  await expect(page.getByRole("tab", { name: /Questionnaire/ })).toContainText(
    "Draft",
  );

  // The unsaved-changes prompt arms on a STRUCTURED-only edit.
  let dialogMessage: string | undefined;
  page.once("dialog", async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect.poll(() => dialogMessage).toContain("unsaved changes");
  // Dismissing the prompt cancels the navigation — still on the fill page.
  await expect(block).toBeVisible();

  // The edit produces a REAL, restorable draft.
  await expect.poll(() => fillDraftCount(page), { timeout: 5000 }).toBe(1);

  await page.reload();
  await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
  // `time_of_death` is NOT draft-excluded — the restore bar must not carry
  // the `files`-style "structured answers... aren't covered" warning here.
  await expect(
    page.getByText(/structured answers .* aren.t covered by local drafts/i),
  ).not.toBeVisible();

  await page.getByRole("button", { name: /resume/i }).click();
  await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
  await expect(
    questionBlock(page, timeOfDeathFixture.label).getByLabel(
      timeOfDeathFixture.label,
      { exact: true },
    ),
  ).toHaveValue(value);
});

/** Resolves a charge item definition catalog entry's real `slug` by exact
 *  title — used to check what the wire actually carries against what the
 *  API says that title's slug is, rather than re-deriving the slugify rule
 *  by hand. */
async function chargeItemDefinitionSlug(title: string): Promise<string> {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/facility/${getFacilityId()}/charge_item_definition/?title=${encodeURIComponent(title)}&limit=10`,
    { headers: adminApiHeaders() },
  );
  expect(res.ok).toBe(true);
  const data = (await res.json()) as {
    results: { slug: string; title: string }[];
  };
  const match = data.results.find((entry) => entry.title === title);
  expect(
    match,
    `no charge_item_definition catalog entry titled "${title}"`,
  ).toBeTruthy();
  return match!.slug;
}

/**
 * PROJECTION AND SUBMIT AGREE — what the clinician sees is exactly what
 * gets sent. Pinned on `charge_item`: a list-shaped type where the
 * displayed rows and the submitted rows could plausibly diverge (a filter
 * on one side but not the other), unlike a singleton.
 */
test("Structured invariant 4: the rows on screen are exactly the rows submitted, in the same order", async ({
  page,
}) => {
  const chargeItemFixture = STRUCTURED_FIXTURES.charge_item;
  const questionnaireId = await getQuestionnaireIdBySlug(
    chargeItemFixture.slug,
  );
  await page.goto(structuredFixtureUrl(questionnaireId));

  const block = questionBlock(page, chargeItemFixture.label);
  await expect(block).toBeVisible();

  const titles = ["Amoxicillin 500mg Capsule", "Paracetamol 500mg Tablet"];
  const expectedSlugs = await Promise.all(
    titles.map((title) => chargeItemDefinitionSlug(title)),
  );

  for (const title of titles) {
    await block
      .getByRole("combobox")
      .filter({ hasText: "Add charges" })
      .click();
    await page.getByPlaceholder("Search charge item definitions").fill(title);
    await page.getByRole("option").filter({ hasText: title }).click();
  }

  const displayedRows = block.locator('[role="row"][data-structured-row]');
  await expect(displayedRows).toHaveCount(2);
  const displayedTitles = await displayedRows.evaluateAll((nodes) =>
    nodes.map((node) => node.textContent ?? ""),
  );

  await questionBlock(page, "Plain note")
    .getByRole("textbox")
    .fill(faker.lorem.words(3));

  const batchRequest = page.waitForRequest(
    (request) =>
      request.url().includes("/api/v1/batch_requests/") &&
      request.method() === "POST",
  );
  await submitForm(page);
  await expectToast(page, /questionnaire submitted successfully/i);
  const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
    requests: {
      url: string;
      body: { requests: { charge_item_definition: string }[] };
    }[];
  };
  const applyRequest = body.requests.find((r) =>
    r.url.includes("/apply_charge_item_defs/"),
  );
  expect(
    applyRequest,
    "the charge_item section must compose exactly one apply_charge_item_defs request",
  ).toBeTruthy();

  // Same COUNT, same ORDER: every displayed row's title (position N)
  // corresponds exactly to the submitted request's charge item definition
  // slug (position N) for that same catalog entry — verified against the
  // real catalog, not a guessed slugify rule.
  const submittedRows = applyRequest!.body.requests;
  expect(submittedRows).toHaveLength(titles.length);
  for (const [index, title] of titles.entries()) {
    expect(displayedTitles[index]).toContain(title);
    expect(submittedRows[index].charge_item_definition).toBe(
      expectedSlugs[index],
    );
  }
});
