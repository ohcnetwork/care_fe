import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import {
  draftFormCount,
  draftFormNoteText,
  settleAutosaveDebounce,
} from "tests/helper/fillDrafts";
import {
  addQuestionnaireViaUi,
  answerRespiratoryStatusRequired,
  waitForBatchRequest,
} from "tests/helper/questionnaire";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

/** Form A: the route-mounted (primary) questionnaire. */
const PRIMARY_SLUG = "respiratory_status-v3";
/** Form B: added in-session — plain questions only, so the assertion is
 *  about the session plumbing and not about a structured adapter. */
const ADDED_SLUG = "patient_feedback";
const ADDED_TITLE = /Feedback Form/;

/** Appends form B (the feedback form) to the open session. */
async function addFeedbackForm(page: Page) {
  await addQuestionnaireViaUi(page, { search: "Feedback", title: ADDED_TITLE });
}

test.describe("Fill page multi-questionnaire sessions", () => {
  let fillUrl: string;
  let primaryId: string;
  let addedId: string;

  test.beforeEach(async ({ page, facilityId, isolatedEncounter }) => {
    primaryId = await getQuestionnaireIdBySlug(PRIMARY_SLUG);
    addedId = await getQuestionnaireIdBySlug(ADDED_SLUG);
    // Each test gets its own encounter: some submit, and /updates must show
    // only this test's responses.
    const { patientId, encounterId } = isolatedEncounter;
    fillUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${primaryId}`;
    await page.goto(fillUrl);
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
  });

  test(
    "adds a second questionnaire and submits both in one batch",
    { tag: ["@atomic", "@cap:questionnaire.fill.multi-form.submit"] },
    async ({ page }) => {
      const noteA = `A-${faker.string.alphanumeric(10)}`;
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      await answerRespiratoryStatusRequired(page);
      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(noteA);

      // Only the primary form exists so far.
      await expect(page.locator("[data-form-key]")).toHaveCount(1);

      await addFeedbackForm(page);

      // Form B joins the SAME scroll, below form A — one page, two forms.
      const forms = page.locator("[data-form-key]");
      await expect(forms).toHaveCount(2);
      await expect(forms.nth(0)).toHaveAttribute("data-form-key", primaryId);
      await expect(forms.nth(1)).toHaveAttribute("data-form-key", addedId);
      await expect(
        forms.nth(1).getByRole("heading", { name: ADDED_TITLE }),
      ).toBeVisible();

      // Answering form B writes into ITS OWN store — form A keeps its answer.
      await questionBlock(page, "Any Suggestions for Improvement")
        .getByRole("textbox")
        .fill(noteB);
      await expect(
        questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
      ).toHaveValue(noteA);

      // One Save Changes submits both forms in ONE batch. Asserted at the
      // network layer, not just by both notes turning up on /updates: two
      // separate batch calls also render green, while losing the
      // cross-form all-or-nothing semantics the one batch exists for.
      const batchRequest = waitForBatchRequest(page);
      await page.getByRole("button", { name: "Save Changes" }).click();

      const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
        requests: { url: string }[];
      };
      const submitUrls = body.requests
        .map((request) => request.url)
        .filter((url) => url.includes("/submit/"));
      expect(submitUrls).toHaveLength(2);
      expect(submitUrls).toContain(
        `/api/v1/questionnaire/${primaryId}/submit/`,
      );
      expect(submitUrls).toContain(`/api/v1/questionnaire/${addedId}/submit/`);

      await expectToast(page, "Questionnaire submitted successfully");
      await page.waitForURL(/\/updates$/);

      await expect(page.getByText(noteA)).toBeVisible();
      await expect(page.getByText(noteB)).toBeVisible();
    },
  );

  test(
    "the local draft covers the whole session and Resume brings the added form back",
    { tag: ["@atomic", "@cap:questionnaire.fill.autosave"] },
    async ({ page }) => {
      const noteA = `A-${faker.string.alphanumeric(10)}`;
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(noteA);
      await addFeedbackForm(page);
      await questionBlock(page, "Any Suggestions for Improvement")
        .getByRole("textbox")
        .fill(noteB);

      // Reload: the pagehide flush persists ONE draft covering both forms.
      await page.reload();
      await expect(
        questionBlock(page, "Is bilateral air entry present?"),
      ).toBeVisible();
      await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
      await expect(
        page.getByText("Includes 1 added questionnaire."),
      ).toBeVisible();
      // Nothing is seeded before the clinician says so — the added form is
      // not on the page yet either.
      await expect(page.locator("[data-form-key]")).toHaveCount(1);

      await page.getByRole("button", { name: /resume/i }).click();
      await expect(page.locator("[data-form-key]")).toHaveCount(2);
      await expect(
        questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
      ).toHaveValue(noteA);
      await expect(
        questionBlock(page, "Any Suggestions for Improvement").getByRole(
          "textbox",
        ),
      ).toHaveValue(noteB);
    },
  );

  test(
    "Resume re-persists the whole session, so leaving without typing keeps both forms",
    { tag: ["@atomic", "@cap:questionnaire.fill.autosave"] },
    async ({ page }) => {
      const noteA = `A-${faker.string.alphanumeric(10)}`;
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(noteA);
      await addFeedbackForm(page);
      await questionBlock(page, "Any Suggestions for Improvement")
        .getByRole("textbox")
        .fill(noteB);

      await page.reload();
      await expect(
        questionBlock(page, "Is bilateral air entry present?"),
      ).toBeVisible();
      await page.getByRole("button", { name: /resume/i }).click();
      await expect(page.locator("[data-form-key]")).toHaveCount(2);

      // Resuming re-adds the drafted forms asynchronously, so the draft has
      // to be re-persisted once they register — otherwise the stored
      // session silently shrinks back to the primary form.
      await expect.poll(() => draftFormCount(page)).toBe(2);

      // Leave WITHOUT typing anything after Resume.
      await page.reload();
      await expect(
        questionBlock(page, "Is bilateral air entry present?"),
      ).toBeVisible();
      await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
      await expect(
        page.getByText("Includes 1 added questionnaire."),
      ).toBeVisible();

      await page.getByRole("button", { name: /resume/i }).click();
      await expect(page.locator("[data-form-key]")).toHaveCount(2);
      await expect(
        questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
      ).toHaveValue(noteA);
      await expect(
        questionBlock(page, "Any Suggestions for Improvement").getByRole(
          "textbox",
        ),
      ).toHaveValue(noteB);
    },
  );

  test(
    "removing an added form drops it from the persisted draft",
    { tag: ["@atomic", "@cap:questionnaire.fill.autosave"] },
    async ({ page }) => {
      const noteA = `A-${faker.string.alphanumeric(10)}`;
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(noteA);
      await addFeedbackForm(page);
      await questionBlock(page, "Any Suggestions for Improvement")
        .getByRole("textbox")
        .fill(noteB);

      // Wait until the added form's answers are actually SAVED, so the
      // removal below has no pending debounce to ride on — the flush would
      // otherwise mask a removal that never reaches storage on its own.
      await expect.poll(() => draftFormCount(page)).toBe(2);

      const addedForm = page.locator(`[data-form-key="${addedId}"]`);
      await addedForm.getByRole("button", { name: "Remove" }).click();
      await expect(page.locator("[data-form-key]")).toHaveCount(1);

      // The removal must reach the stored draft, not just the page.
      await expect.poll(() => draftFormCount(page)).toBe(1);
      await page.reload();
      await expect(
        questionBlock(page, "Is bilateral air entry present?"),
      ).toBeVisible();
      await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
      await expect(
        page.getByText("Includes 1 added questionnaire."),
      ).toHaveCount(0);

      await page.getByRole("button", { name: /resume/i }).click();
      await expect(page.locator("[data-form-key]")).toHaveCount(1);
      await expect(
        questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
      ).toHaveValue(noteA);
    },
  );

  test(
    "re-adding a removed form and retyping its old answer still autosaves it",
    { tag: ["@atomic", "@cap:questionnaire.fill.autosave"] },
    async ({ page }) => {
      // The autosave subscription now caches a per-form signature (keyed by
      // form key) instead of re-serializing the whole session on every
      // keystroke — see useFillAutosave.ts. A removed form's cache entry
      // must not survive: re-adding the SAME questionnaire (same form key,
      // a brand-new empty store) and retyping its EXACT old answer would,
      // under a stale cache, compare equal to the leftover signature and
      // silently skip the debounced write. `draftFormNoteText` reads past a
      // pagehide flush (which would persist regardless, masking the bug),
      // so it only passes if the keystroke was genuinely recognised as an
      // edit and reached storage on its own.
      const noteA = `A-${faker.string.alphanumeric(10)}`;
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      // The primary form must hold content too — otherwise removing form B
      // leaves an empty session, `saveFillDraft` takes its clear-on-empty
      // branch, and the draft key disappears entirely (mirrors the
      // pre-existing "removing an added form" test above).
      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(noteA);
      await addFeedbackForm(page);
      const addedNote = questionBlock(
        page,
        "Any Suggestions for Improvement",
      ).getByRole("textbox");
      await addedNote.fill(noteB);
      await expect.poll(() => draftFormCount(page)).toBe(2);

      const addedForm = page.locator(`[data-form-key="${addedId}"]`);
      await addedForm.getByRole("button", { name: "Remove" }).click();
      await expect(page.locator("[data-form-key]")).toHaveCount(1);
      await expect.poll(() => draftFormCount(page)).toBe(1);

      // Re-add the same questionnaire — it mounts empty.
      await addFeedbackForm(page);
      const reAddedNote = questionBlock(
        page,
        "Any Suggestions for Improvement",
      ).getByRole("textbox");
      await expect(reAddedNote).toHaveValue("");

      // Retype the exact text the removed form used to hold.
      await reAddedNote.fill(noteB);
      await expect
        .poll(() => draftFormNoteText(page, addedId), { timeout: 5000 })
        .toBe(noteB);
    },
  );

  test(
    "nothing this session does reaches storage while the restore prompt is un-acted",
    { tag: ["@atomic", "@cap:questionnaire.fill.autosave"] },
    async ({ page }) => {
      const noteA = `A-${faker.string.alphanumeric(10)}`;
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(noteA);
      await page.reload();
      await expect(
        questionBlock(page, "Is bilateral air entry present?"),
      ).toBeVisible();
      await expect(page.getByText(/unsaved entry from/i)).toBeVisible();

      // Work in an added form WITHOUT answering the prompt, then drop it.
      // The stored draft is the clinician's to accept or discard until they
      // say so, so neither the typing (which would overwrite it) nor the
      // emptying (which would take saveFillDraft's clear-on-empty branch)
      // may touch it.
      await addFeedbackForm(page);
      await questionBlock(page, "Any Suggestions for Improvement")
        .getByRole("textbox")
        .fill(noteB);
      // Past AUTOSAVE_DEBOUNCE_MS before asserting: the stored draft already
      // holds exactly the one form, so a poll for that would resolve on its
      // first evaluation and never see a debounced write on its way in.
      await settleAutosaveDebounce(page);
      expect(await draftFormCount(page)).toBe(1);
      await page
        .locator(`[data-form-key="${addedId}"]`)
        .getByRole("button", { name: "Remove" })
        .click();
      await expect(page.locator("[data-form-key]")).toHaveCount(1);

      await page.reload();
      await expect(
        questionBlock(page, "Is bilateral air entry present?"),
      ).toBeVisible();
      await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
      // And it is still the ORIGINAL draft: resuming brings noteA back and
      // nothing from the un-acted session.
      await page.getByRole("button", { name: /resume/i }).click();
      await expect(
        questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
      ).toHaveValue(noteA);
      await expect(page.locator("[data-form-key]")).toHaveCount(1);
    },
  );

  test(
    "Discard drops the drafted form only, never a form added since the prompt",
    { tag: ["@atomic", "@cap:questionnaire.fill.autosave"] },
    async ({ page }) => {
      const noteA = `A-${faker.string.alphanumeric(10)}`;
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(noteA);
      await expect.poll(() => draftFormCount(page)).toBe(1);

      await page.reload();
      await expect(
        questionBlock(page, "Is bilateral air entry present?"),
      ).toBeVisible();
      await expect(page.getByText(/unsaved entry from/i)).toBeVisible();

      // Add a questionnaire and type real answers into it while the
      // stale-draft banner is still up — "Add questionnaire" is not gated on
      // the prompt, so this is a plain sequence of two shipped features.
      await addFeedbackForm(page);
      const addedAnswer = questionBlock(
        page,
        "Any Suggestions for Improvement",
      ).getByRole("textbox");
      await addedAnswer.fill(noteB);

      // Discard means "drop that old draft", not "wipe what I just typed".
      await page.getByRole("button", { name: "Discard", exact: true }).click();
      await expect(page.getByText(/unsaved entry from/i)).toBeHidden();
      await expect(addedAnswer).toHaveValue(noteB);
      // The drafted (primary) form IS reset — that is what Discard promises.
      await expect(
        questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
      ).toHaveValue("");
    },
  );

  test(
    "remove affordance drops a non-primary form",
    { tag: ["@atomic", "@cap:questionnaire.fill.multi-form.remove"] },
    async ({ page }) => {
      const noteA = `A-${faker.string.alphanumeric(10)}`;
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      await answerRespiratoryStatusRequired(page);
      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(noteA);

      await addFeedbackForm(page);
      const addedForm = page.locator(`[data-form-key="${addedId}"]`);
      await expect(addedForm).toHaveCount(1);
      await questionBlock(page, "Any Suggestions for Improvement")
        .getByRole("textbox")
        .fill(noteB);

      // Remove drops the added form (and its answers) from the session; the
      // primary form has no remove affordance.
      await addedForm.getByRole("button", { name: "Remove" }).click();
      await expect(addedForm).toHaveCount(0);
      await expect(page.locator("[data-form-key]")).toHaveCount(1);
      await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0);

      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire submitted successfully");
      await page.waitForURL(/\/updates$/);

      // Only form A reached the server.
      await expect(page.getByText(noteA)).toBeVisible();
      await expect(page.getByText(noteB)).toHaveCount(0);
    },
  );

  test(
    "Resume applies a drafted added form even after it was re-added by hand",
    { tag: ["@atomic", "@cap:questionnaire.fill.autosave"] },
    async ({ page }) => {
      // The collision case: the clinician re-adds the drafted questionnaire
      // from the picker BEFORE pressing Resume. addQuestionnaire dedupes by
      // key, so Resume used to drop the snapshot silently — and the next
      // persist erased those answers from the stored draft for good. Resume
      // now merges the snapshot into the already-mounted form, the same
      // overlay rule the primary form uses.
      const noteB = `B-${faker.string.alphanumeric(10)}`;

      await questionBlock(page, "Note on Bilateral Air Entry")
        .getByRole("textbox")
        .fill(`A-${faker.string.alphanumeric(10)}`);
      await addFeedbackForm(page);
      await questionBlock(page, "Any Suggestions for Improvement")
        .getByRole("textbox")
        .fill(noteB);
      await expect.poll(() => draftFormCount(page)).toBe(2);

      await page.reload();
      await expect(
        questionBlock(page, "Is bilateral air entry present?"),
      ).toBeVisible();
      await expect(page.getByText(/unsaved entry from/i)).toBeVisible();

      // Re-add form B by hand while the prompt is still up — it mounts
      // empty.
      await addFeedbackForm(page);
      await expect(page.locator("[data-form-key]")).toHaveCount(2);
      await expect(
        questionBlock(page, "Any Suggestions for Improvement").getByRole(
          "textbox",
        ),
      ).toHaveValue("");

      // Resume must land the drafted answers in the already-open form.
      await page.getByRole("button", { name: /resume/i }).click();
      await expect(
        questionBlock(page, "Any Suggestions for Improvement").getByRole(
          "textbox",
        ),
      ).toHaveValue(noteB);
    },
  );
});
