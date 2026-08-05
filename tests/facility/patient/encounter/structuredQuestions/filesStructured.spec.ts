import { faker } from "@faker-js/faker";
import { type Locator, type Page, expect, test } from "@playwright/test";
import {
  fillDraftCount,
  settleAutosaveDebounce,
} from "tests/helper/fillDrafts";
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
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Per-type matrix (spec §10) for `files` — Task 11 Step 2. Two things this
 * port fixes/documents, both pinned below:
 *
 *  - the INDEX-IDENTITY regression the legacy widget had: `FileQuestion.tsx
 *    :137-144` re-derived every row's `name` by ARRAY POSITION against
 *    `fileUpload.files` on every render, so removing row 0 silently
 *    relabelled every remaining row with the wrong name. `FilesEditor.tsx`
 *    drains the picker's buffer into ROWS once (`list.addRows`) and never
 *    re-derives anything by position again — `"remove"` below is a
 *    regression GUARD (the fix already landed), not a defect this spec
 *    goes looking for.
 *  - `files` is the WAVE'S ONE deliberate `draftPolicy: "exclude"` (D6,
 *    `definitions/files.tsx`): a raw `File` cannot round-trip through
 *    localStorage. `"draft"` below asserts the EXCLUSION is communicated
 *    (the restore bar's `fill_draft_structured_skipped` copy) rather than a
 *    silent, unexplained loss — and that the REST of the same form (the
 *    plain "Plain note" question) still drafts normally alongside it.
 *
 * Reuses `fillSubmitGuards.spec.ts`'s `tinyFilePayloads` approach: a tiny
 * in-memory `.txt` payload per entry, no disk writes, no cleanup.
 */

const fixture = STRUCTURED_FIXTURES.files;

/** Every body row inside `block` — excludes the header row, which also
 *  carries `role="row"` but no `data-structured-row` (mirrors
 *  `chargeItemV2.spec.ts`'s identical helper for the same primitive). */
function rows(block: Locator): Locator {
  return block.locator('[role="row"][data-structured-row]');
}

function tinyFilePayloads(
  count: number,
): { name: string; mimeType: string; buffer: Buffer }[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `tiny-${index}-${faker.string.alphanumeric(6)}.txt`,
    mimeType: "text/plain",
    buffer: Buffer.from(`tiny file ${index}`),
  }));
}

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

test.describe("Structured question: files", () => {
  test("add: attaching two files renders two rows, each independently nameable", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const payloads = tinyFilePayloads(2);
    await block.locator('input[type="file"]').setInputFiles(payloads);
    await expect(rows(block)).toHaveCount(2);

    const nameInputs = block.getByPlaceholder("File Name");
    await expect(nameInputs).toHaveCount(2);
    await nameInputs.nth(0).fill("first-file-name");
    await nameInputs.nth(1).fill("second-file-name");
    await expect(nameInputs.nth(0)).toHaveValue("first-file-name");
    await expect(nameInputs.nth(1)).toHaveValue("second-file-name");

    // The original (picked) file name is its own, separate, non-editable
    // column — the row title on a collapsed mobile card and, at this
    // desktop viewport, its own cell.
    await expect(rows(block).nth(0)).toContainText(payloads[0].name);
    await expect(rows(block).nth(1)).toContainText(payloads[1].name);
  });

  test("remove: removing the FIRST file leaves the remaining row with its OWN name", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const payloads = tinyFilePayloads(2);
    await block.locator('input[type="file"]').setInputFiles(payloads);
    await expect(rows(block)).toHaveCount(2);

    const nameInputs = block.getByPlaceholder("File Name");
    await nameInputs.nth(0).fill("first-file-name");
    await nameInputs.nth(1).fill("second-file-name");

    // Remove row 0 through the shared row-actions menu.
    await rows(block)
      .nth(0)
      .getByRole("button", { name: "Row actions" })
      .click();
    await page.getByRole("menuitem", { name: "Remove", exact: true }).click();

    await expect(rows(block)).toHaveCount(1);
    // THE REGRESSION GUARD: the surviving row still carries its OWN name —
    // under the legacy widget's index-derived relabelling
    // (`FileQuestion.tsx:137-144`), removing row 0 would have shifted this
    // value up to "first-file-name" (or reset it to the placeholder).
    await expect(block.getByPlaceholder("File Name")).toHaveValue(
      "second-file-name",
    );
    await expect(rows(block)).toContainText(payloads[1].name);
    await expect(rows(block)).not.toContainText(payloads[0].name);
  });

  test("validation: a blank name on one row blocks Save and binds the required message to that row only", async ({
    page,
  }) => {
    const posts = trackBatchRequests(page);
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const payloads = tinyFilePayloads(2);
    await block.locator('input[type="file"]').setInputFiles(payloads);
    await expect(rows(block)).toHaveCount(2);

    // Name only the SECOND row — the first is left blank on purpose.
    const nameInputs = block.getByPlaceholder("File Name");
    await nameInputs.nth(1).fill("named-file");

    await submitForm(page);

    const unnamedCell = rows(block).nth(0).locator('[data-column="name"]');
    const namedCell = rows(block).nth(1).locator('[data-column="name"]');
    await expect(unnamedCell.getByRole("alert")).toContainText(
      "This field is required",
    );
    await expect(namedCell.getByRole("alert")).toHaveCount(0);

    expect(
      posts,
      "client validation must block Save before any batch request is sent",
    ).toHaveLength(0);
  });

  test("draft: attaching a file writes NO draft for that section, while the rest of the form still drafts normally (D6)", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    const fillUrl = structuredFixtureUrl(questionnaireId);
    await page.goto(fillUrl);

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const note = faker.lorem.sentence();
    await questionBlock(page, "Plain note").getByRole("textbox").fill(note);

    const payloads = tinyFilePayloads(1);
    await block.locator('input[type="file"]').setInputFiles(payloads);
    await block.getByPlaceholder("File Name").fill("attached-file");
    await expect(rows(block)).toHaveCount(1);
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    await page.reload();
    // The bar shows AND says plainly that a structured section could not be
    // carried — the exclusion is communicated, not a silent loss.
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await expect(
      page.getByText(/structured answers .* aren.t covered by local drafts/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();

    // The REST of the form (the plain note) restored normally...
    await expect(
      questionBlock(page, "Plain note").getByRole("textbox"),
    ).toHaveValue(note);
    // ...but the files section — excluded by design (D6) — comes back
    // empty. A raw `File` handle cannot survive a reload no matter what;
    // the restore does not pretend otherwise.
    await expect(rows(questionBlock(page, fixture.label))).toHaveCount(0);
  });

  test("an attached-but-unnamed file alone (no other content) writes no draft at all", async ({
    page,
  }) => {
    // Cross-check of the exclusion above: `files` content with NOTHING else
    // answered on the form leaves no SAFE partition to persist, so
    // `snapshotSession`'s `anyContent` guard means no draft is written in
    // the first place — not merely one that later restores empty.
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();
    await block
      .locator('input[type="file"]')
      .setInputFiles(tinyFilePayloads(1));
    await expect(rows(block)).toHaveCount(1);

    // Explicit settle, not a poll: storage is already empty here, so
    // `expect.poll` would resolve on its first evaluation and never reach
    // past AUTOSAVE_DEBOUNCE_MS to see a write that was on its way.
    await settleAutosaveDebounce(page);
    expect(await fillDraftCount(page)).toBe(0);
  });

  test("submit: saves the files as one batch request and they show on the encounter's files tab", async ({
    page,
  }) => {
    test.slow();
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();

    const payloads = tinyFilePayloads(2);
    await block.locator('input[type="file"]').setInputFiles(payloads);
    const uniqueName = `e2e-files-${faker.string.alphanumeric(8)}`;
    const nameInputs = block.getByPlaceholder("File Name");
    await nameInputs.nth(0).fill(uniqueName);
    await nameInputs.nth(1).fill(`${uniqueName}-second`);

    await questionBlock(page, "Plain note")
      .getByRole("textbox")
      .fill(faker.lorem.words(3));

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    const posts = trackBatchRequests(page);
    await submitForm(page);
    await batchRequest;
    await expectToast(page, /questionnaire submitted successfully/i);
    await page.waitForURL(/\/encounter\/[^/]+\/updates$/);

    // Two files, ONE outer batch POST (each file is a sub-request inside
    // the same call — P1-10's own boundary, `fillSubmitGuards.spec.ts`).
    expect(posts).toHaveLength(1);

    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/files`,
    );
    await expect(
      page.getByText(uniqueName, { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(`${uniqueName}-second`, { exact: false }).first(),
    ).toBeVisible();
  });
});
