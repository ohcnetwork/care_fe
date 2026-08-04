import { faker } from "@faker-js/faker";
import { type Locator, type Page, expect, test } from "@playwright/test";
import { submitForm } from "tests/helper/questionnaire";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import {
  STRUCTURED_FIXTURES,
  structuredFixtureUrl,
} from "tests/helper/structuredFixtures";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Per-type matrix (spec §10) for `encounter` — Task 10 Step 3: the
 * singleton and the discharge rules. `encounter` is the ONLY Phase-2 type
 * that prefetches a real server row (every other type in this wave is
 * create-only), and its legacy definition PUT the whole encounter back
 * unconditionally on every submit — the zero-upsert pin below is the
 * assertion the legacy definition could never pass.
 *
 * SHARED ENCOUNTER: every test here shares the ONE fixture encounter
 * (`getEncounterId()`), the same one dozens of other specs in this suite
 * read/write. Two tests below (`"edit"`, and Task 12's own positive case in
 * `structuredInvariants.spec.ts`) perform a REAL, PERMANENT PUT against
 * it — status/priority changes, which are safely reversible in the UI
 * (unlike `time_of_death`'s one-way deceased flag). Every test picks "a
 * DIFFERENT value than whatever is currently selected" rather than a
 * hardcoded one, so it is correct regardless of what an earlier run or a
 * concurrently-running spec left behind. `mode: "serial"` keeps this
 * file's own tests from racing each other's edits on that one encounter —
 * the same reason `fillServerDraft.spec.ts` serialises its describe.
 *
 * ENCOUNTER CLASSES: this deployment's `.env.local` sets
 * `REACT_ALLOWED_ENCOUNTER_CLASSES="imp,amb,hh"` — `imp` (Inpatient) is the
 * one HOSPITALIZED class in that list, so the discharge-disposition tests
 * below select it explicitly rather than assuming the baseline's class.
 * `REACT_DEFAULT_DISCHARGE_DISPOSITION` is NOT set on this deployment, so
 * `blocksSaveForMissingDischargeDisposition` fires as LIVE required-field
 * enforcement, not a dead safety net (`model.ts`'s own doc comment).
 */
test.describe.configure({ mode: "serial" });

const fixture = STRUCTURED_FIXTURES.encounter;

/** The Select/Input control immediately following a `<Label>` whose text
 *  CONTAINS `labelText` — `contains`, not exact, because the discharge
 *  disposition label carries a hardcoded trailing `*` this deployment
 *  always renders once the discharge fields show
 *  (`EncounterEditor.tsx`). Neither `<Select>`/`<Label>` here uses
 *  `htmlFor`, so `getByLabel` cannot find these — the Radix `<Select>`
 *  root emits no DOM node of its own, so the rendered
 *  `<button role="combobox">`/`<input>` is a true next sibling. */
function fieldControl(
  block: Locator,
  labelText: string,
  tag: "button" | "input" = "button",
) {
  return block.locator(
    `xpath=.//label[contains(normalize-space(.), ${JSON.stringify(labelText)})]/following-sibling::${tag}[1]`,
  );
}

/** Opens a Select trigger and picks the first option whose text differs
 *  from whatever is CURRENTLY shown — correct regardless of the shared
 *  encounter's present state. Returns the label picked. */
async function selectDifferentOption(
  page: Page,
  trigger: Locator,
): Promise<string> {
  const current = (await trigger.innerText()).trim();
  await trigger.click();
  const options = page.getByRole("option");
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const text = (await options.nth(i).innerText()).trim();
    if (text !== current) {
      await options.nth(i).click();
      return text;
    }
  }
  throw new Error(`No alternate option found besides "${current}"`);
}

/** At least one exact-text match is actually rendered (not merely present
 *  — see this file's "edit" test comment on the summary panel's two
 *  parallel breakpoint layouts). */
async function expectVisibleSomewhere(page: Page, text: string): Promise<void> {
  const matches = page.getByText(text, { exact: true });
  await expect
    .poll(
      async () => {
        const count = await matches.count();
        for (let i = 0; i < count; i += 1) {
          if (await matches.nth(i).isVisible()) return true;
        }
        return false;
      },
      {
        message: `expected "${text}" to be visible in at least one match`,
        timeout: 10000,
      },
    )
    .toBe(true);
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

test.describe("Structured question: encounter", () => {
  test("zero-upsert: an untouched encounter section produces no PUT, even though it prefetched", async ({
    page,
  }) => {
    const batches = trackBatchRequests(page);
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();
    // The widget rendered WITH its prefetched row — the status combobox
    // only carries a value once the fetch landed (mirrors
    // `fillAutosave.spec.ts:206`'s identical proof for this same fixed
    // pseudo-questionnaire).
    const statusTrigger = fieldControl(block, "Encounter Status");
    await expect(statusTrigger).toBeVisible();
    await expect(statusTrigger).not.toHaveText("Select Status");

    // Touch NOTHING in the encounter section. The plain "Plain note"
    // question is answered instead, purely so the OVERALL submit has
    // something to send — an entirely untouched session is refused before
    // any batch is even composed
    // (`useSubmitQuestionnaire.ts`'s `requests.length === 0` guard, a
    // session-wide check unrelated to this section's own behavior), which
    // would leave nothing here to inspect.
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
      "an untouched encounter section must never PUT — this is the guarantee the legacy definition could not make",
    ).toBe(false);
    expect(batches.length).toBeGreaterThan(0);
  });

  test("edit: changing status and priority produces exactly one encounter PUT, and the new values show on the encounter page", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const newStatus = await selectDifferentOption(
      page,
      fieldControl(block, "Encounter Status"),
    );
    const newPriority = await selectDifferentOption(
      page,
      fieldControl(block, "Priority"),
    );

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

    await page.waitForURL(/\/encounter\/[^/]+\/updates$/);
    // The summary panel renders TWO parallel layouts (an `xl:hidden` one
    // and its `hidden xl:flex` sibling in `encounter-details.tsx`) — only
    // one is visible at the current viewport, and the OTHER still matches
    // `getByText` (merely hidden, not absent), so this checks "visible
    // SOMEWHERE" rather than assuming a single strict match.
    await expectVisibleSomewhere(page, newStatus);
    await expectVisibleSomewhere(page, newPriority);
  });

  test("validation: a discharged hospitalized encounter with no disposition blocks Save and PUTs nothing", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    // imp — the one HOSPITALIZED class this deployment allows
    // (`REACT_ALLOWED_ENCOUNTER_CLASSES="imp,amb,hh"`).
    await fieldControl(block, "Encounter Class").click();
    await page.getByRole("option", { name: "Inpatient", exact: true }).click();
    // "Discharged" only ever appears in the status dropdown for an
    // ALREADY-discharged row (`EncounterEditorBody`'s options filter) — the
    // "Mark for discharge" button is the one path to it from here.
    await block.getByRole("button", { name: "Mark for discharge" }).click();

    const posts: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/api/v1/batch_requests/")
      ) {
        posts.push(request.url());
      }
    });
    await submitForm(page);

    // The section-level `StructuredFieldError` beside the disposition
    // select (`EncounterEditorBody`'s `dispositionErrorId`) — `.first()`
    // because a second, block-level rendering of the same message can
    // also appear (this dotted field key has no row id, so it takes the
    // section-level branch `QuestionBlock`'s own allow-list does not
    // suppress the way it does for row-keyed structured errors).
    await expect(
      block
        .locator('[role="alert"]')
        .filter({ hasText: /required/i })
        .first(),
    ).toBeVisible();
    expect(
      posts,
      "client validation must block Save before any batch request is sent",
    ).toHaveLength(0);
  });

  test("regression (Task 7): setting a disposition then editing an unrelated field does not reset it", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    await fieldControl(block, "Encounter Class").click();
    await page.getByRole("option", { name: "Inpatient", exact: true }).click();
    await block.getByRole("button", { name: "Mark for discharge" }).click();

    const dispositionTrigger = fieldControl(block, "Discharge Disposition");
    await expect(dispositionTrigger).toBeVisible();
    await dispositionTrigger.click();
    await page.getByRole("option", { name: "Home", exact: true }).click();
    await expect(dispositionTrigger).toHaveText("Home");

    // The unrelated edit Task 7 fixed: legacy re-pinned the disposition to
    // the SERVER's value (`null`) on every subsequent edit, which snapped
    // the clinician's pick back to the placeholder the instant they typed
    // anywhere else.
    await fieldControl(block, "Hospital Identifier", "input").fill(
      faker.string.alphanumeric(8),
    );

    await expect(dispositionTrigger).toHaveText("Home");
  });

  test("?toDischarge=true seeds a dirty, discharged row on mount", async ({
    page,
  }) => {
    // PRODUCT DEFECT, FOUND AND FIXED. `useStructuredRows.ts`'s one-shot
    // `initialEdits` seed effect used to call `commit(...)` synchronously
    // from a CHILD component's `useEffect`, while
    // `useFillSessionAutosave.ts`'s subscription effect (an ANCESTOR,
    // mounted by `QuestionnaireFillPage.tsx`) captures its baseline
    // `formSignatures` and subscribes in a SEPARATE effect. React fires
    // child effects before parent effects on mount, so the seeded
    // discharge landed before any listener existed to see it as a CHANGE —
    // no "Draft" chip, and Cancel navigated away with no unsaved-changes
    // warning after a pre-seeded discharge. Confirmed by instrumented
    // trace (both effects logging `performance.now()`): the seed's
    // `commit` landed strictly before the ancestor's first subscription
    // attempt, every run. Fixed by deferring the seed's actual `commit`
    // call one microtask (`useStructuredRows.ts`'s seed effect) — a
    // microtask can't preempt React's synchronous post-commit effect
    // flush, so it always lands after every ancestor effect due this pass,
    // and still resolves before the next paint (no visual flash). Pinned
    // at the unit level too:
    // `useStructuredRows.initialEditsSeedTiming.test.ts`. This test is
    // no longer `test.fail()` — it is a real, passing pin.
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(
      `${structuredFixtureUrl(questionnaireId)}?toDischarge=true`,
    );

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();
    await expect(fieldControl(block, "Encounter Status")).toHaveText(
      "Discharged",
    );

    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    let dialogMessage: string | undefined;
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect.poll(() => dialogMessage).toContain("unsaved changes");
    // Dismissing the prompt means Cancel was cancelled — still on the fill
    // page, not navigated away.
    await expect(block).toBeVisible();
  });

  test("draft: changing the priority survives reload+restore without the status drifting", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    const fillUrl = structuredFixtureUrl(questionnaireId);
    await page.goto(fillUrl);

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();
    const statusBefore = (
      await fieldControl(block, "Encounter Status").innerText()
    ).trim();
    const newPriority = await selectDifferentOption(
      page,
      fieldControl(block, "Priority"),
    );
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    await page.reload();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    // Fresh mount: the prefetch has landed again (the untouched-section
    // guarantee), but nothing restored yet.
    await expect(
      fieldControl(questionBlock(page, fixture.label), "Priority"),
    ).not.toHaveText(newPriority);

    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    const restoredBlock = questionBlock(page, fixture.label);
    await expect(fieldControl(restoredBlock, "Priority")).toHaveText(
      newPriority,
    );
    // The status was never touched THIS session — it must read exactly
    // what the fresh prefetch supplied, not drift from the restore.
    await expect(fieldControl(restoredBlock, "Encounter Status")).toHaveText(
      statusBefore,
    );
  });
});
