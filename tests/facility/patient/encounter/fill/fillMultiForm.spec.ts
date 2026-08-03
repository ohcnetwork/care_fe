import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/** Form A: the route-mounted (primary) questionnaire. */
const PRIMARY_SLUG = "respiratory_status-v3";
/** Form B: added in-session — plain questions only, so the assertion is
 *  about the session plumbing and not about a structured adapter. */
const ADDED_SLUG = "patient_feedback";
const ADDED_TITLE = /Feedback Form/;

/** Answers form A's two required questions (see fillValidation.spec.ts). */
async function answerPrimaryRequired(page: Page) {
  await questionBlock(page, "Is bilateral air entry present?")
    .getByRole("radio", { name: "yes", exact: true })
    .click();
  await questionBlock(page, "Select Modality")
    .getByRole("radio", { name: "oxygen_support", exact: true })
    .click();
}

/** Opens the add-questionnaire picker and appends `title` to the session.
 *  The fill page gives QuestionnaireSearch a plain-button trigger, so the
 *  affordance has a real accessible name (the default combobox trigger
 *  takes no name from its contents). */
async function addQuestionnaire(page: Page, title: RegExp) {
  await page.getByRole("button", { name: "Add questionnaire" }).click();
  await page.getByPlaceholder("Search Forms").fill("Feedback");
  await page.getByRole("option", { name: title }).click();
}

/**
 * How many forms the ONE persisted session draft currently holds.
 * Inspected directly because React flushes passive effects after the DOM
 * commit — a DOM-only assertion can win the race against the autosave
 * write, and these specs are precisely about what reaches storage.
 */
async function draftFormCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((entry) =>
      entry.startsWith("care_qn_fill_draft--"),
    );
    const raw = key ? localStorage.getItem(key) : null;
    if (!raw) return 0;
    return (JSON.parse(raw) as { forms?: unknown[] }).forms?.length ?? 0;
  });
}

test.describe("Fill page multi-questionnaire sessions", () => {
  let fillUrl: string;
  let primaryId: string;
  let addedId: string;

  test.beforeEach(async ({ page }) => {
    primaryId = await getQuestionnaireIdBySlug(PRIMARY_SLUG);
    addedId = await getQuestionnaireIdBySlug(ADDED_SLUG);
    fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${primaryId}`;
    await page.goto(fillUrl);
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
  });

  test("adds a second questionnaire and submits both in one batch", async ({
    page,
  }) => {
    const noteA = `A-${faker.string.alphanumeric(10)}`;
    const noteB = `B-${faker.string.alphanumeric(10)}`;

    await answerPrimaryRequired(page);
    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(noteA);

    // Only the primary form exists so far.
    await expect(page.locator("[data-form-key]")).toHaveCount(1);

    await addQuestionnaire(page, ADDED_TITLE);

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
    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: { url: string }[];
    };
    const submitUrls = body.requests
      .map((request) => request.url)
      .filter((url) => url.includes("/submit/"));
    expect(submitUrls).toHaveLength(2);
    expect(submitUrls).toContain(`/api/v1/questionnaire/${primaryId}/submit/`);
    expect(submitUrls).toContain(`/api/v1/questionnaire/${addedId}/submit/`);

    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);

    await expect(page.getByText(noteA)).toBeVisible();
    await expect(page.getByText(noteB)).toBeVisible();
  });

  test("the local draft covers the whole session and Resume brings the added form back", async ({
    page,
  }) => {
    const noteA = `A-${faker.string.alphanumeric(10)}`;
    const noteB = `B-${faker.string.alphanumeric(10)}`;

    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(noteA);
    await addQuestionnaire(page, ADDED_TITLE);
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
  });

  test("Resume re-persists the whole session, so leaving without typing keeps both forms", async ({
    page,
  }) => {
    const noteA = `A-${faker.string.alphanumeric(10)}`;
    const noteB = `B-${faker.string.alphanumeric(10)}`;

    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(noteA);
    await addQuestionnaire(page, ADDED_TITLE);
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
  });

  test("removing an added form drops it from the persisted draft", async ({
    page,
  }) => {
    const noteA = `A-${faker.string.alphanumeric(10)}`;
    const noteB = `B-${faker.string.alphanumeric(10)}`;

    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(noteA);
    await addQuestionnaire(page, ADDED_TITLE);
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
    await expect(page.getByText("Includes 1 added questionnaire.")).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.locator("[data-form-key]")).toHaveCount(1);
    await expect(
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
    ).toHaveValue(noteA);
  });

  test("nothing this session does reaches storage while the restore prompt is un-acted", async ({
    page,
  }) => {
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
    await addQuestionnaire(page, ADDED_TITLE);
    await questionBlock(page, "Any Suggestions for Improvement")
      .getByRole("textbox")
      .fill(noteB);
    // Longer than the autosave debounce: if typing could reach storage,
    // it already would have.
    await expect.poll(() => draftFormCount(page), { timeout: 5000 }).toBe(1);
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
  });

  test("Discard drops the drafted form only, never a form added since the prompt", async ({
    page,
  }) => {
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
    await addQuestionnaire(page, ADDED_TITLE);
    const addedAnswer = questionBlock(
      page,
      "Any Suggestions for Improvement",
    ).getByRole("textbox");
    await addedAnswer.fill(noteB);

    // Discard means "drop that old draft", not "wipe what I just typed".
    await page.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(addedAnswer).toHaveValue(noteB);
    // The drafted (primary) form IS reset — that is what Discard promises.
    await expect(
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
    ).toHaveValue("");
  });

  test("remove affordance drops a non-primary form", async ({ page }) => {
    const noteA = `A-${faker.string.alphanumeric(10)}`;
    const noteB = `B-${faker.string.alphanumeric(10)}`;

    await answerPrimaryRequired(page);
    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(noteA);

    await addQuestionnaire(page, ADDED_TITLE);
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
  });

  test("Resume applies a drafted added form even after it was re-added by hand", async ({
    page,
  }) => {
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
    await addQuestionnaire(page, ADDED_TITLE);
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
    await addQuestionnaire(page, ADDED_TITLE);
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
  });
});
