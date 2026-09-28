import { expect, test } from "@playwright/test";
import {
  authorActiveQuestionnaire,
  importQuestionsInStudio,
  newEncounter,
  openFormFromEncounter,
  saveStudio,
  selectInOutline,
} from "tests/helper/authoredForms";
import {
  checkVisibility,
  submitAndExpectSuccess,
  verifyLabelledValues,
} from "tests/helper/questionnaire";
import {
  addTopLevelQuestion,
  getQuestionnaireViaApi,
  openQuestionBuilder,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire revisions, answered on the same encounter", () => {
  test("answers given on v1 stay visible after the questions change, and v2 takes its new question", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Revisions ${stamp}`;
    const kept = `Chief complaint ${stamp}`;
    const removed = `Smoking status ${stamp}`;
    const added = `Follow-up plan ${stamp}`;
    let id = "";
    let v1Revision = 0;

    await test.step("v1: author two questions", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        { text: kept, type: "string", link_id: "kept" },
        { text: removed, type: "string", link_id: "removed" },
      ]);
      await saveStudio(page);
      v1Revision = (await getQuestionnaireViaApi(id)).internal_revision ?? 0;
    });

    const encounter = await newEncounter();

    await test.step("Answer v1 on the encounter", async () => {
      await openFormFromEncounter(page, encounter, title);
      await questionBlock(page, kept)
        .getByRole("textbox")
        .fill(`v1 kept ${stamp}`);
      await questionBlock(page, removed)
        .getByRole("textbox")
        .fill(`v1 removed ${stamp}`);
      await submitAndExpectSuccess(page);
      await verifyLabelledValues(page, [
        [kept, `v1 kept ${stamp}`],
        [removed, `v1 removed ${stamp}`],
      ]);
    });

    await test.step("v2: delete one question and add another", async () => {
      await page.goto(
        `/facility/${getFacilityId()}/settings/questionnaires/${id}`,
      );
      await openQuestionBuilder(page);
      await selectInOutline(page, removed);
      await page.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Delete question" }).click();
      await expect(
        page.getByRole("navigation").getByRole("button", { name: removed }),
      ).toHaveCount(0);
      await addTopLevelQuestion(page, added);
      await saveStudio(page);
    });

    await test.step("The server bumped the revision and holds the new question set", async () => {
      const saved = await getQuestionnaireViaApi(id);
      expect(saved.internal_revision).toBe(v1Revision + 1);
      expect(saved.questions.map((q) => q.text)).toEqual([kept, added]);
    });

    await test.step("The encounter's fill page now asks the v2 questions", async () => {
      await openFormFromEncounter(page, encounter, title);
      await checkVisibility(page, kept, true);
      await checkVisibility(page, added, true);
      await checkVisibility(page, removed, false);
      await questionBlock(page, kept)
        .getByRole("textbox")
        .fill(`v2 kept ${stamp}`);
      await questionBlock(page, added)
        .getByRole("textbox")
        .fill(`v2 added ${stamp}`);
      await submitAndExpectSuccess(page);
    });

    await test.step("The encounter shows the v2 answers and still shows every v1 answer", async () => {
      await verifyLabelledValues(page, [[added, `v2 added ${stamp}`]]);
      for (const value of [
        `v1 kept ${stamp}`,
        `v1 removed ${stamp}`,
        `v2 kept ${stamp}`,
      ]) {
        await expect(page.getByText(value, { exact: true })).toHaveCount(1);
      }
      // The v1 response still labels its answer with the since-deleted question.
      await verifyLabelledValues(page, [[removed, `v1 removed ${stamp}`]]);
    });
  });
});
