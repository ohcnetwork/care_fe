import { type Page, expect, test } from "@playwright/test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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
 * P1-9's case needs a RESUMED server draft, which only exists behind
 * `REACT_ENABLE_QUESTIONNAIRE_DRAFT` — Vite INLINES the flag at build time,
 * so (same reasoning as fillServerDraft.spec.ts) this asks the served
 * bundle whether the feature is there instead of trusting the test
 * process's own env, and only skips when the built app genuinely lacks it.
 *
 * CI COVERAGE: that sub-test skips unless the app is BUILT with
 * `REACT_ENABLE_QUESTIONNAIRE_DRAFT=true` — set it on the build step (and,
 * to catch drift, on the test step too).
 */
const flagRequested = process.env.REACT_ENABLE_QUESTIONNAIRE_DRAFT === "true";
const SAVE_DRAFT = "Save as Draft";

test.describe("Fill page submit guards", () => {
  test("P1-9: a resumed draft's submit sub-request carries form_submission", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
    const fillUrl = `${encounterUrl}/questionnaire/${questionnaireId}`;

    await page.goto(fillUrl);
    const airEntry = questionBlock(page, "Is bilateral air entry present?");
    await expect(airEntry).toBeVisible();
    // The page is healthy — its primary action rendered. Anything missing
    // beyond this point is about the draft feature, not a broken mount.
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

    // A bare draft is enough to resume from — its content isn't the point
    // of this spec, only that a `form_submission` id exists to link to.
    await saveDraft.click();
    await expectToast(page, "Draft saved successfully");
    await page.waitForURL(/\/updates$/);

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(/continue_draft=/);
    const draftId = new URL(page.url()).searchParams.get("continue_draft");
    expect(draftId, "continue_draft missing from the resumed URL").toBeTruthy();

    // Satisfy required fields so the submit clears client validation and
    // actually reaches the batch compose this spec is pinning.
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

    // End to end: the server took it, and the draft's record completed.
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
  });

  test.describe("P1-10: batch size cap preflight", () => {
    /** A tiny throwaway .txt per entry. Real content is irrelevant — only
     *  that it's an allowed extension (see BACKEND_ALLOWED_EXTENSIONS) and
     *  that there are 21 of them: unlike plain answers (which all share ONE
     *  `/submit/` request), each "files" entry becomes its OWN POST in the
     *  batch, so this is the practical way to cross MAX_BATCH_REQUESTS (20)
     *  from the UI without authoring 21 separate questions. */
    function makeTinyFiles(count: number): string[] {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "care-fe-batch-cap-"));
      return Array.from({ length: count }, (_, index) => {
        const filePath = path.join(dir, `tiny-${index}.txt`);
        fs.writeFileSync(filePath, `tiny file ${index}`);
        return filePath;
      });
    }

    /** Tracks POSTs to the batch endpoint from the moment it's called —
     *  registering the listener AFTER the click would only prove no
     *  request had arrived YET, not that the abort never sends one. */
    function trackBatchRequests(page: Page): string[] {
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

    test("21 files in one question aborts with the specific toast and posts nothing", async ({
      page,
    }) => {
      test.slow();
      const posts = trackBatchRequests(page);

      await page.goto(
        `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/files`,
      );

      const block = questionBlock(page, "Files");
      await expect(block).toBeVisible();

      const files = makeTinyFiles(21);
      await block.locator('input[type="file"]').setInputFiles(files);

      // Every file needs a name to clear client validation (required
      // regardless of the question's own `required` flag — see
      // validateFileUploadQuestion) — otherwise the submit would abort on
      // "validation_failed" before ever reaching the batch cap this test
      // means to exercise.
      const nameInputs = block.getByPlaceholder("File Name");
      await expect(nameInputs).toHaveCount(21);
      for (let index = 0; index < 21; index += 1) {
        await nameInputs.nth(index).fill(`tiny-${index}`);
      }

      await page.getByRole("button", { name: "Save Changes" }).click();

      await expectToast(
        page,
        "This submission has 21 operations; the server accepts at most 20 in one save. Remove some files or split the forms.",
      );

      // The whole point of the preflight: the oversized batch never left
      // the browser.
      expect(
        posts,
        "no /api/v1/batch_requests/ POST may fire when the batch is over the cap",
      ).toHaveLength(0);
    });
  });
});
