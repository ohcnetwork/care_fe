import {
  trackBatchRequests,
  waitForBatchRequest,
} from "tests/helper/questionnaire";
import { questionBlock } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * P1-10: the backend's `/api/v1/batch_requests/` endpoint hard-caps the
 * number of sub-requests per call at `MAX_BATCH_REQUESTS` (20 — see
 * `useSubmitFillSession.ts`). Plain answers all share ONE `/submit/`
 * request no matter how many questions are answered, so the practical way
 * to cross that cap from the UI is a `files` structured question: each
 * uploaded file becomes its own POST in the batch. This spec pins both
 * sides of the boundary on the fixed `files` pseudo-questionnaire (one
 * required `files` question, encounter subject).
 *
 * (P1-9's draft-linkage case lives in fillServerDraft.spec.ts's serial
 * describe instead of here — it needs a real server draft on the shared
 * fixture encounter, and that file's serial mode is what keeps such tests
 * from racing each other's drafts-card state across parallel workers.)
 */

/** A tiny in-memory .txt payload per entry — real content is irrelevant,
 *  only that it's an allowed extension (see BACKEND_ALLOWED_EXTENSIONS)
 *  and that there are enough of them. Built in memory (no disk writes, no
 *  cleanup needed) per the house pattern — see
 *  questionnaireDetailActions.spec.ts's `setInputFiles({name, mimeType,
 *  buffer})` use. */
function tinyFilePayloads(
  count: number,
): { name: string; mimeType: string; buffer: Buffer }[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `tiny-${index}.txt`,
    mimeType: "text/plain",
    buffer: Buffer.from(`tiny file ${index}`),
  }));
}

/** Names every file row so client validation clears (required per-file
 *  regardless of the question's own `required` flag — see
 *  validateFileUploadQuestion) and the submit reaches the batch compose
 *  this spec means to exercise, instead of aborting on validation first. */
async function nameEveryFile(
  block: ReturnType<typeof questionBlock>,
  count: number,
) {
  const nameInputs = block.getByPlaceholder("File Name");
  await expect(nameInputs).toHaveCount(count);
  for (let index = 0; index < count; index += 1) {
    await nameInputs.nth(index).fill(`tiny-${index}`);
  }
}

test.describe("P1-10: batch size cap preflight", () => {
  test(
    "21 files in one question aborts with the specific toast and posts nothing",
    { tag: ["@atomic", "@cap:questionnaire.fill.submit"] },
    async ({ page }) => {
      test.slow();
      const posts = trackBatchRequests(page);

      await page.goto(
        `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/files`,
      );

      const block = questionBlock(page, "Files");
      await expect(block).toBeVisible();

      await block
        .locator('input[type="file"]')
        .setInputFiles(tinyFilePayloads(21));
      await nameEveryFile(block, 21);

      await page.getByRole("button", { name: "Save Changes" }).click();

      await expectToast(
        page,
        "This submission has 21 operations; the server accepts at most 20 in one save. Remove some files or split the forms.",
      );

      // The whole point of the preflight: the oversized batch never left the
      // browser.
      expect(
        posts,
        "no /api/v1/batch_requests/ POST may fire when the batch is over the cap",
      ).toHaveLength(0);
    },
  );

  test(
    "20 files in one question submits as a single batch request",
    { tag: ["@atomic", "@cap:questionnaire.fill.submit"] },
    async ({ page, facilityId, isolatedEncounter }) => {
      test.slow();
      const posts = trackBatchRequests(page);
      const { patientId, encounterId } = isolatedEncounter;

      // Uploads 20 real files: on this test's own encounter, not the shared one.
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/files`,
      );

      const block = questionBlock(page, "Files");
      await expect(block).toBeVisible();

      await block
        .locator('input[type="file"]')
        .setInputFiles(tinyFilePayloads(20));
      await nameEveryFile(block, 20);

      const batchRequest = waitForBatchRequest(page);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await batchRequest;

      // The passing side of the same boundary: exactly at the cap, the
      // submit goes through as one ordinary batch call.
      await expectToast(page, "Questionnaire submitted successfully");
      expect(
        posts,
        "exactly one /api/v1/batch_requests/ POST for a batch at the cap",
      ).toHaveLength(1);
    },
  );
});
