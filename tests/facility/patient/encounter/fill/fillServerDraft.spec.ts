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

/** The draft id the overview row's Continue action deep-links to. */
function draftIdFromUrl(url: string): string {
  const id = new URL(url).searchParams.get("continue_draft");
  expect(id, "continue_draft missing from the resumed URL").toBeTruthy();
  return id as string;
}

function serverDraftRow(page: Page, draftId: string) {
  return page.locator(
    `[data-draft-source="server"][data-draft-id="${draftId}"]`,
  );
}

function createdDraftResponse(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/form_submission/") &&
      response.request().method() === "POST" &&
      response.ok(),
  );
}

test.describe("Fill page server draft", () => {
  // Serial: these tests share one encounter. Scope every row assertion to
  // its created record so unrelated clinician drafts remain untouched.
  test.describe.configure({ mode: "serial" });

  for (const operation of ["create", "update"] as const) {
    test(`${operation} draft freezes edits, prevents duplicate saves, and releases after failure`, async ({
      page,
    }) => {
      const questionnaireId = await getQuestionnaireIdBySlug(
        "respiratory_status-v3",
      );
      const draftId = crypto.randomUUID();
      const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
      const fillUrl = `${encounterUrl}/questionnaire/${questionnaireId}${operation === "update" ? `?continue_draft=${draftId}` : ""}`;
      const saveMethod = operation === "create" ? "POST" : "PUT";
      const saveUrl = `**/api/v1/form_submission/${operation === "update" ? `${draftId}/` : ""}`;

      let releaseRequest: (() => void) | undefined;
      const pendingResponse = new Promise<void>((resolve) => {
        releaseRequest = resolve;
      });
      const savedBodies: {
        questionnaire?: string;
        response_dump: {
          questionnaireResponses: {
            responses: { values: { value?: string }[] }[];
          };
        };
      }[] = [];
      await page.route(saveUrl, async (route) => {
        if (operation === "update" && route.request().method() === "GET") {
          return route.fulfill({
            json: {
              id: draftId,
              status: "draft",
              response_dump: {
                questionnaireResponses: {
                  questionnaire: { id: questionnaireId },
                  responses: [],
                },
              },
            },
          });
        }
        if (route.request().method() !== saveMethod) return route.fallback();
        savedBodies.push(route.request().postDataJSON());
        await pendingResponse;
        // Keep this test independent of the encounter's persisted drafts.
        await route.fulfill({ status: 500, json: {} });
      });

      try {
        const { saveDraft } = await openFillPage(page, fillUrl);
        const noteBox = questionBlock(
          page,
          "Note on Bilateral Air Entry",
        ).getByRole("textbox");
        const note = `Captured ${operation} draft`;
        await noteBox.fill(note);

        // Two immediate activations exercise a rapid repeated Save click.
        await saveDraft.evaluate((button) => {
          (button as HTMLButtonElement).click();
          (button as HTMLButtonElement).click();
        });
        await expect.poll(() => savedBodies.length).toBe(1);
        await expect(noteBox).toBeDisabled();
        await expect(saveDraft).toBeDisabled();
        await expect(
          page.getByRole("button", { name: "Save Changes" }),
        ).toBeDisabled();
        await expect(
          questionBlock(page, "Note on Bilateral Air Entry").getByRole(
            "button",
            { name: "Add note", exact: true },
          ),
        ).toBeDisabled();
        if (operation === "create") {
          expect(savedBodies[0].questionnaire).toBe(questionnaireId);
          await expect(
            page.getByRole("button", { name: "Add questionnaire" }),
          ).toBeDisabled();
        }
        await expect(noteBox).toHaveValue(note);
        expect(
          savedBodies[0].response_dump.questionnaireResponses.responses.flatMap(
            (response) => response.values.map((value) => value.value),
          ),
        ).toContain(note);
        expect(savedBodies).toHaveLength(1);

        releaseRequest?.();
        await expectToast(page, "Failed to save draft");
        await expect(noteBox).toBeEnabled();
        await expect(saveDraft).toBeEnabled();
        await noteBox.fill(`${note} after failure`);

        // The failed request must release the synchronous save guard too.
        await saveDraft.click();
        await expect.poll(() => savedBodies.length).toBe(2);
        expect(
          savedBodies[1].response_dump.questionnaireResponses.responses.flatMap(
            (response) => response.values.map((value) => value.value),
          ),
        ).toContain(`${note} after failure`);
        await expect(noteBox).toBeEnabled();
      } finally {
        releaseRequest?.();
      }
    });
  }

  test("fixed structured forms do not offer server drafts for synthetic questionnaire ids", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/symptom`,
    );
    await expect(questionBlock(page, "Symptom")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: SAVE_DRAFT })).toHaveCount(0);
  });

  test("saved draft lists as a compact overview row, resumes, and re-saves onto the same record", async ({
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
    const createdDraft = createdDraftResponse(page);
    await saveDraft.click();
    const createdResponse = await createdDraft;
    expect(createdResponse.request().postDataJSON().questionnaire).toBe(
      questionnaireId,
    );
    const { id: draftId } = (await createdResponse.json()) as { id: string };
    const savedRow = serverDraftRow(page, draftId);
    await expectToast(page, "Draft saved successfully");
    await page.waitForURL(/\/updates$/);

    // The overview exposes one compact row; saved answers are shown only
    // after Continue, and the row retains this exact server record's id.
    await expect(
      page.getByRole("heading", { name: "Draft Forms" }),
    ).toBeVisible();
    await expect(savedRow).toBeVisible();
    await expect(savedRow).toContainText("Shared");
    await expect(
      savedRow.locator("input, textarea, [data-question-id]"),
    ).toHaveCount(0);

    // Continue deep-links back with ?continue_draft= and the server copy
    // seeds the store.
    await savedRow.getByRole("button", { name: /^Continue/ }).click();
    await page.waitForURL(/continue_draft=/);
    expect(draftIdFromUrl(page.url())).toBe(draftId);
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
      savedRow.getByRole("button", { name: /^Continue/ }),
    ).toHaveCount(1);
    await expect(
      savedRow.locator("input, textarea, [data-question-id]"),
    ).toHaveCount(0);

    await savedRow.getByRole("button", { name: /^Continue/ }).click();
    await page.waitForURL(/continue_draft=/);
    expect(draftIdFromUrl(page.url())).toBe(draftId);
    await expect(noteBox()).toHaveValue(editedNote);

    // Submitting a resumed draft completes that same record and removes
    // just its row, regardless of other local or server drafts.
    await questionBlock(page, "Is bilateral air entry present?")
      .getByRole("radio", { name: "no", exact: true })
      .click();
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "invasive", exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
    const completedDraft = await fetch(
      `${apiBaseUrl()}/api/v1/form_submission/${draftId}/`,
      { headers: adminApiHeaders() },
    );
    expect(completedDraft.ok).toBe(true);
    expect((await completedDraft.json()).status).toBe("submitted");
    await expect(savedRow).toHaveCount(0);
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
    const createdDraft = createdDraftResponse(page);
    await saveDraft.click();
    const { id: draftId } = (await (await createdDraft).json()) as {
      id: string;
    };
    await expectToast(page, "Draft saved successfully");
    await page.waitForURL(/\/updates$/);

    await serverDraftRow(page, draftId)
      .getByRole("button", { name: /^Continue/ })
      .click();
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

    // …and the prompt actually arms. Dismissing it cancels the navigation,
    // so the edit is still on screen and still resumable below.
    let dialogMessage: string | undefined;
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect.poll(() => dialogMessage).toContain("unsaved changes");
    await expect(noteBox()).toHaveValue(editedNote);

    // Complete this record without assuming the encounter has no other drafts.
    await questionBlock(page, "Is bilateral air entry present?")
      .getByRole("radio", { name: "no", exact: true })
      .click();
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "invasive", exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
    await expect(serverDraftRow(page, draftId)).toHaveCount(0);
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
        questionnaire: questionnaireId,
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

  // P1-9: shares this describe's encounter and drafts card, so it rides the
  // same serial guarantee as the tests above rather than racing them from a
  // separate file/worker.
  test("P1-9: submitting a resumed draft links the batch's /submit/ body to it via form_submission", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
    const fillUrl = `${encounterUrl}/questionnaire/${questionnaireId}`;

    const { saveDraft } = await openFillPage(page, fillUrl);

    // A bare draft is enough to resume from — its content isn't the point
    // of this case, only that a form_submission id exists to link to.
    const createdDraft = createdDraftResponse(page);
    await saveDraft.click();
    const { id: draftId } = (await (await createdDraft).json()) as {
      id: string;
    };
    await expectToast(page, "Draft saved successfully");
    await page.waitForURL(/\/updates$/);

    await serverDraftRow(page, draftId)
      .getByRole("button", { name: /^Continue/ })
      .click();
    await page.waitForURL(/continue_draft=/);
    expect(draftIdFromUrl(page.url())).toBe(draftId);

    // Satisfy required fields so the submit clears client validation and
    // actually reaches the batch compose this case is pinning.
    await questionBlock(page, "Is bilateral air entry present?")
      .getByRole("radio", { name: "no", exact: true })
      .click();
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "invasive", exact: true })
      .click();

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: {
        url: string;
        body: { form_submission?: string };
      }[];
    };
    const submit = body.requests.find((request) =>
      request.url.includes(`/questionnaire/${questionnaireId}/submit/`),
    );
    // This is the P1-9 fix: without it the submit sub-request has no
    // `form_submission`, and the backend's duplicate-submission guard
    // (which keys off that field) never engages for a resumed draft.
    expect(
      submit?.body.form_submission,
      "submit sub-request must link the resumed draft via form_submission",
    ).toBe(draftId);

    // End to end: the server took it, and the draft's record completed —
    // same cleanup contract every test in this describe leaves behind.
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
    await expect(serverDraftRow(page, draftId)).toHaveCount(0);
  });
});
