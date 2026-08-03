import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * "Save as draft" writes a `form_submission` record and is feature-flagged
 * by `REACT_ENABLE_QUESTIONNAIRE_DRAFT`, which Vite INLINES at build time.
 * The test process's env therefore says nothing about the app under test —
 * so this spec asks the served bundle instead (is the button there?) and
 * only skips when the built app genuinely lacks the feature.
 *
 * The env var is still read, as an expectation: if it is set, a missing
 * button is drift or a regression and fails loudly rather than skipping.
 *
 * CI COVERAGE: this spec skips unless the app is BUILT with
 * `REACT_ENABLE_QUESTIONNAIRE_DRAFT=true` — set it on the build step (and,
 * to catch drift, on the test step too).
 */
const flagRequested = process.env.REACT_ENABLE_QUESTIONNAIRE_DRAFT === "true";

const SAVE_DRAFT = "Save as Draft";

/** Open the fill page and settle the flag question against reality. */
async function openFillPage(page: Page, fillUrl: string) {
  await page.goto(fillUrl);
  const airEntry = questionBlock(page, "Is bilateral air entry present?");
  await expect(airEntry).toBeVisible();
  // The page is healthy — its primary action rendered. Anything missing
  // beyond this point is about the feature, not about a broken mount.
  await expect(
    page.getByRole("button", { name: "Save Changes" }),
  ).toBeVisible();

  const saveDraft = page.getByRole("button", { name: SAVE_DRAFT });
  if (!(await saveDraft.isVisible())) {
    if (flagRequested) {
      throw new Error(
        `REACT_ENABLE_QUESTIONNAIRE_DRAFT=true but the served app renders no "${SAVE_DRAFT}" button — ` +
          "the bundle was built without the flag, or the availability gate regressed.",
      );
    }
    test.skip(true, "the built app has questionnaire server drafts disabled");
  }
  return { airEntry, saveDraft };
}

/** The draft id the overview card's Continue action deep-links to. */
function draftIdFromUrl(url: string): string {
  const id = new URL(url).searchParams.get("continue_draft");
  expect(id, "continue_draft missing from the resumed URL").toBeTruthy();
  return id as string;
}

test.describe("Fill page server draft", () => {
  // Serial: these tests share ONE encounter, and the overview's drafts card
  // lists every open `form_submission` on it. Run in parallel they see each
  // other's Continue buttons; each test here leaves the card empty when it
  // finishes, so serialising is enough to keep them independent.
  test.describe.configure({ mode: "serial" });

  test("saved draft lists on the overview, previews readonly, resumes, and re-saves onto the same record", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
    const fillUrl = `${encounterUrl}/questionnaire/${questionnaireId}`;
    const note = faker.lorem.sentence();
    const editedNote = faker.lorem.sentence();

    const { airEntry, saveDraft } = await openFillPage(page, fillUrl);
    const noteBox = () =>
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox");

    await airEntry.getByRole("radio", { name: "yes", exact: true }).click();
    await noteBox().fill(note);

    // POST branch — no draft to continue yet.
    await saveDraft.click();
    await expectToast(page, "Draft saved successfully");
    await page.waitForURL(/\/updates$/);

    // The encounter overview's drafts card is the server draft's consumer:
    // it previews the saved answers through the v2 renderer, readonly. The
    // only questionnaire block on this page belongs to that preview.
    await expect(
      page.getByRole("heading", { name: "Draft Forms" }),
    ).toBeVisible();
    await expect(noteBox()).toHaveValue(note);
    await expect(noteBox()).toBeDisabled();

    // Continue deep-links back with ?continue_draft= and the server copy
    // seeds the store.
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(/continue_draft=/);
    const draftId = draftIdFromUrl(page.url());
    await expect(noteBox()).toHaveValue(note);
    await expect(
      questionBlock(page, "Is bilateral air entry present?").getByRole(
        "radio",
        {
          name: "yes",
          exact: true,
        },
      ),
    ).toHaveAttribute("aria-checked", "true");

    // PUT branch — saving a resumed draft updates that record instead of
    // creating a second one.
    await noteBox().fill(editedNote);
    await page.getByRole("button", { name: SAVE_DRAFT }).click();
    await expectToast(page, "Draft saved successfully");
    await page.waitForURL(/\/updates$/);
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toHaveCount(1);
    await expect(noteBox()).toHaveValue(editedNote);

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(/continue_draft=/);
    expect(draftIdFromUrl(page.url())).toBe(draftId);
    await expect(noteBox()).toHaveValue(editedNote);

    // Submitting a resumed draft completes that same record, so the card
    // empties out again.
    await questionBlock(page, "Is bilateral air entry present?")
      .getByRole("radio", { name: "no", exact: true })
      .click();
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "invasive", exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
    await expect(
      page.getByRole("heading", { name: "Draft Forms" }),
    ).not.toBeVisible();
  });

  test("editing a resumed server draft marks the session dirty and guards navigation", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
    const fillUrl = `${encounterUrl}/questionnaire/${questionnaireId}`;
    const note = faker.lorem.sentence();
    const editedNote = faker.lorem.sentence();

    const { saveDraft } = await openFillPage(page, fillUrl);
    const noteBox = () =>
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox");

    await noteBox().fill(note);
    await saveDraft.click();
    await expectToast(page, "Draft saved successfully");
    await page.waitForURL(/\/updates$/);

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(/continue_draft=/);
    await expect(noteBox()).toHaveValue(note);

    // Resuming is not itself an edit — nothing unsaved yet.
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).not.toContainText("Draft");

    // Editing is. This mode deliberately writes no local draft (the server
    // copy is authoritative), which is exactly why the unsaved-changes
    // guard matters here: it is the only thing standing between the
    // clinician's edits and an unwarned navigation away.
    await noteBox().fill(editedNote);
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // Complete the record so the drafts card is empty again for whatever
    // runs next (see the serial note on this describe).
    await questionBlock(page, "Is bilateral air entry present?")
      .getByRole("radio", { name: "no", exact: true })
      .click();
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "invasive", exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
    await expect(
      page.getByRole("heading", { name: "Draft Forms" }),
    ).not.toBeVisible();
  });

  test("a form_submission that is no longer a draft refuses to resume", async ({
    page,
  }) => {
    // Not gated on the Save-as-Draft flag: the record is created straight
    // through the API, and the ?continue_draft= resume path always exists.
    // A SUBMITTED record re-opening as an editable draft would let one
    // submission file twice — the URL is shareable and outlives the
    // overview card's own status filter.
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const response = await fetch(`${apiBaseUrl()}/api/v1/form_submission/`, {
      method: "POST",
      headers: adminApiHeaders(),
      body: JSON.stringify({
        // The create serializer resolves the questionnaire by SLUG.
        questionnaire: "respiratory_status-v3",
        patient: getPatientId(),
        encounter: getEncounterId(),
        status: "submitted",
        response_dump: {
          questionnaireResponses: {
            questionnaire: { id: questionnaireId },
            responses: [],
            errors: [],
          },
        },
      }),
    });
    expect(response.ok, "fixture form_submission POST failed").toBe(true);
    const submission = (await response.json()) as { id: string };

    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}?continue_draft=${submission.id}`,
    );

    // The dead-end error page, not an editable form.
    await expect(page.getByText("Draft cannot be recovered")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toHaveCount(0);
  });
});
