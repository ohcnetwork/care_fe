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

/**
 * P1-4: an in-flight submission used to leave the whole fill session fully
 * editable — the canvas inputs, the Remove-form control, and the
 * add-questionnaire picker all stayed live while the batch request was in
 * flight, so an edit typed during that window could diverge from the
 * payload already sent (composeBatch snapshots the store at click time —
 * see e13430da9 — but nothing stopped a SECOND edit from landing after
 * that snapshot was taken and before the response came back). This pins
 * the freeze: every one of those surfaces disables for the duration of
 * the submit and releases again once it settles, success or failure.
 *
 * Same two-form fixture as fillMultiForm.spec.ts (respiratory_status-v3
 * primary + patient_feedback added) so the Remove-form affordance actually
 * renders — a single-form session never shows it.
 */

const PRIMARY_SLUG = "respiratory_status-v3";
const ADDED_SLUG = "patient_feedback";
const ADDED_TITLE = /Feedback Form/;
const NOTE_LABEL = "Any Suggestions for Improvement";

/** Answers form A's two required questions (see fillValidation.spec.ts). */
async function answerPrimaryRequired(page: Page) {
  await questionBlock(page, "Is bilateral air entry present?")
    .getByRole("radio", { name: "yes", exact: true })
    .click();
  await questionBlock(page, "Select Modality")
    .getByRole("radio", { name: "oxygen_support", exact: true })
    .click();
}

/** Opens the add-questionnaire picker and appends `title` to the session
 *  (mirrors fillMultiForm.spec.ts's own helper — the fill page gives
 *  QuestionnaireSearch a plain-button trigger here, so the affordance has
 *  a real accessible name). */
async function addQuestionnaire(page: Page, title: RegExp) {
  await page.getByRole("button", { name: "Add questionnaire" }).click();
  await page.getByPlaceholder("Search Forms").fill("Feedback");
  await page.getByRole("option", { name: title }).click();
}

interface BatchRequestBody {
  requests: {
    url: string;
    body: { results?: { values: { value?: string }[] }[] };
  }[];
}

/**
 * Intercepts the submit batch and delays it ~2s before resolving —long
 * enough that every assertion below runs against a genuinely in-flight
 * mutation, short enough the test doesn't crawl. Captures the request
 * body so the composed payload can be checked against the click-time
 * value afterward. Never reaches the real backend: `fulfill` answers
 * synthetically either way, and the submit hook's success handler reads
 * nothing off the response body (see useSubmitQuestionnaire.ts), so a
 * bare 200 is exactly as good as a real batch result for the success case.
 */
async function interceptBatchWithDelay(
  page: Page,
  { fail = false }: { fail?: boolean } = {},
): Promise<{ body: () => BatchRequestBody | undefined }> {
  let captured: BatchRequestBody | undefined;
  await page.route("**/api/v1/batch_requests/", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    captured = JSON.parse(
      route.request().postData() ?? "{}",
    ) as BatchRequestBody;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (fail) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [] }),
    });
  });
  return { body: () => captured };
}

test.describe("P1-4: submit freeze", () => {
  let addedId: string;

  test.beforeEach(async ({ page }) => {
    const primaryId = await getQuestionnaireIdBySlug(PRIMARY_SLUG);
    addedId = await getQuestionnaireIdBySlug(ADDED_SLUG);
    const fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${primaryId}`;
    await page.goto(fillUrl);
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();

    await answerPrimaryRequired(page);
    await addQuestionnaire(page, ADDED_TITLE);
    await expect(page.locator("[data-form-key]")).toHaveCount(2);
  });

  test("the session freezes during an in-flight submit and releases on success", async ({
    page,
  }) => {
    const note = `Freeze-${faker.string.alphanumeric(10)}`;
    const noteInput = questionBlock(page, NOTE_LABEL).getByRole("textbox");
    await noteInput.fill(note);

    const addedForm = page.locator(`[data-form-key="${addedId}"]`);
    // Substring "Remove" also matches a repeating question's per-entry
    // remove button elsewhere on the canvas — anchor on the form-level
    // affordance's real accessible name (`remove_questionnaire`: "Remove
    // {{title}}"), not the bare word.
    const removeButton = addedForm.getByRole("button", {
      name: /^Remove Feedback/,
    });
    const addPickerButton = page.getByRole("button", {
      name: "Add questionnaire",
    });
    // The note popover's trigger — a second input-bearing control on the
    // SAME question as `noteInput` that reads only `mode` before this fix,
    // so a note typed during flight was silently discarded on success
    // (notes ARE submitted — composeBatch reads them off the click-time
    // snapshot same as the answer itself).
    const noteButton = questionBlock(page, NOTE_LABEL).getByRole("button", {
      name: "Add note",
    });

    // Sanity: nothing is disabled before Save Changes is pressed.
    await expect(noteInput).toBeEnabled();
    await expect(removeButton).toBeEnabled();
    await expect(addPickerButton).toBeEnabled();
    await expect(noteButton).toBeEnabled();

    const intercepted = await interceptBatchWithDelay(page);
    await page.getByRole("button", { name: "Save Changes" }).click();

    // DURING flight — the whole session freezes, not just the header's
    // own Save/Cancel buttons (which already disabled before this fix).
    await expect(noteInput).toBeDisabled();
    await expect(removeButton).toBeDisabled();
    await expect(addPickerButton).toBeDisabled();
    await expect(noteButton).toBeDisabled();
    // The disabled trigger means the note popover — and its textarea —
    // is unreachable at all: force a click past Playwright's actionability
    // guard and confirm the textarea never appears.
    await noteButton.click({ force: true });
    await expect(page.getByPlaceholder("Add note")).toHaveCount(0);
    // The freeze means there is no way to type over it — confirmed by the
    // disabled assertions above — but the value itself must also still
    // read back exactly what was there at click time, not reset to blank
    // or to some intermediate state.
    await expect(noteInput).toHaveValue(note);

    // The response lands and the success path completes.
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);

    // The composed batch carried exactly the click-time value — nothing
    // typed after Save (there was nothing typeable) diverged from it.
    const body = intercepted.body();
    const submit = body?.requests.find((request) =>
      request.url.includes(`/questionnaire/${addedId}/submit/`),
    );
    const submittedValues = (submit?.body.results ?? []).flatMap((result) =>
      result.values.map((value) => value.value),
    );
    expect(submittedValues).toContain(note);
  });

  test("a failed submit releases the freeze so the session is editable again", async ({
    page,
  }) => {
    const note = `FreezeErr-${faker.string.alphanumeric(10)}`;
    const noteInput = questionBlock(page, NOTE_LABEL).getByRole("textbox");
    await noteInput.fill(note);

    const addedForm = page.locator(`[data-form-key="${addedId}"]`);
    const removeButton = addedForm.getByRole("button", {
      name: /^Remove Feedback/,
    });
    const noteButton = questionBlock(page, NOTE_LABEL).getByRole("button", {
      name: "Add note",
    });

    await interceptBatchWithDelay(page, { fail: true });
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Frozen while the (doomed) request is in flight.
    await expect(noteInput).toBeDisabled();
    await expect(removeButton).toBeDisabled();
    await expect(noteButton).toBeDisabled();

    await expectToast(page, "Failed to submit questionnaire");

    // The failure releases the freeze — the clinician can still fix
    // something and try again, rather than being stuck on a dead form.
    await expect(noteInput).toBeEnabled();
    await expect(removeButton).toBeEnabled();
    await expect(noteButton).toBeEnabled();
    await noteInput.fill(`${note}-retry`);
    await expect(noteInput).toHaveValue(`${note}-retry`);
  });
});
