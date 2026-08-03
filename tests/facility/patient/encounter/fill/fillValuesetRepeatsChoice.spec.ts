import { expect, test, type Page } from "@playwright/test";
import {
  addTopLevelQuestion,
  createQuestionnaireAndOpenBuilder,
  pickValuesetFromAutocomplete,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast, selectFromValueSet } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/** Picks a question type by its cmdk data-value token (see the studio's
 *  builder matrix spec). */
async function pickType(page: Page, type: string): Promise<void> {
  await page.getByRole("combobox").first().click();
  await page
    .locator(`[data-slot="command-item"][data-value="${type}"]`)
    .click();
}

/**
 * P2-5: a repeats choice question bound to a value set (`answer_value_set`,
 * not fixed `answer_option`s) used to be hard-wired to entry 0 —
 * QuestionBlock excluded every choice question from the shared per-index
 * multi-entry path on the premise that choice always manages its own
 * repeats UI, which is only true for the fixed-option variant. A second
 * entry silently overwrote the first instead of adding alongside it. No
 * backend fixture pairs `answer_value_set` with `repeats`, so this
 * authors one via the studio, same as the other builder specs, then fills
 * and submits it on the real encounter fill page.
 */
test.describe("Fill page: repeats + value-set-backed choice", () => {
  test("two entries each keep their own code, in the UI and the submitted batch", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const questionTitle = `Unit given ${stamp}`;
    let questionnaireId = "";

    await test.step("Author a repeats choice question bound to a value set", async () => {
      const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Valueset Repeats ${stamp}`,
      });
      questionnaireId =
        detailUrl.match(/questionnaires\/([0-9a-f-]+)/)?.[1] ?? "";
      expect(questionnaireId).not.toBe("");

      await addTopLevelQuestion(page, questionTitle);
      await pickType(page, "choice");
      await page.getByRole("radio", { name: "Value Set" }).click();
      await pickValuesetFromAutocomplete(page, {
        search: "UCUM",
        optionName: "UCUM Units",
      });
      await page.getByRole("checkbox", { name: "Repeatable" }).click();

      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Fill: pick a code in entry 1, add entry 2, pick a different code", async () => {
      await page.goto(
        `/facility/${facilityId}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
      );
      const block = questionBlock(page, questionTitle);
      await expect(block).toHaveCount(1);

      const entryOneTrigger = block.getByRole("combobox").first();
      await selectFromValueSet(page, entryOneTrigger, { search: "milligram" });
      await expect(entryOneTrigger).toContainText("milligram");

      await block.getByRole("button", { name: "Add Another" }).click();
      const entryTwoTrigger = block.getByRole("combobox").nth(1);
      await selectFromValueSet(page, entryTwoTrigger, { search: "kilogram" });
      await expect(entryTwoTrigger).toContainText("kilogram");

      // Adding/filling entry 2 must not have overwritten entry 1 (the bug:
      // both entries shared the same `values[0]` write).
      await expect(entryOneTrigger).toContainText("milligram");
      await expect(entryTwoTrigger).toContainText("kilogram");
    });

    await test.step("Both entries submit in the batch", async () => {
      const batchRequest = page.waitForRequest(
        (request) =>
          request.url().includes("/api/v1/batch_requests/") &&
          request.method() === "POST",
      );
      await page.getByRole("button", { name: "Save Changes" }).click();

      const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
        requests: {
          url: string;
          body: {
            results?: { values: { coding?: { display?: string } }[] }[];
          };
        }[];
      };
      const submit = body.requests.find((request) =>
        request.url.includes(`/questionnaire/${questionnaireId}/submit/`),
      );
      // A coded value-set answer serializes as `{ coding }` only — no bare
      // `value` string (see serializeResponseValues) — so the codes are
      // read off `coding.display`.
      const submittedDisplays = (submit?.body.results ?? []).flatMap((result) =>
        result.values.map((value) => value.coding?.display),
      );
      expect(submittedDisplays).toContain("milligram");
      expect(submittedDisplays).toContain("kilogram");

      await expectToast(page, "Questionnaire submitted successfully");
      await page.waitForURL(/\/updates$/);
    });
  });
});
