import { expect, test } from "@playwright/test";
import {
  createQuestionnaireAndOpenBuilder,
  importStringQuestionsViaUi,
} from "tests/helper/questionnaireV2";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 builder — selection after delete", () => {
  test(
    "deleting the last of 10 questions selects the 9th question, not the first",
    { tag: ["@atomic", "@cap:questionnaire.author.question.delete"] },
    async ({ page }) => {
      const stamp = Date.now();
      const titles = Array.from({ length: 10 }, (_, i) => `Q${i + 1} ${stamp}`);
      const nav = page.getByRole("navigation");
      const titleInput = page.getByRole("textbox", { name: "Question Title" });

      await createQuestionnaireAndOpenBuilder(page, {
        basePath: "/admin/questionnaires",
        title: `QV2 Del ${stamp}`,
      });
      await importStringQuestionsViaUi(page, { titles });

      await test.step("Select the 10th (last) question", async () => {
        await nav.getByRole("button", { name: titles[9] }).click();
        await expect(titleInput).toHaveValue(titles[9]);
      });

      await test.step("Deleting it selects the 9th question, not the first", async () => {
        await page.getByRole("button", { name: "More options" }).click();
        await page.getByRole("menuitem", { name: "Delete question" }).click();
        await expect(nav.getByRole("button", { name: titles[9] })).toBeHidden();

        // Regression: the reducer's removeQuestions fell back to
        // `questions[0]` on any deletion of the selected question, jumping
        // to the first question/section instead of the new last sibling.
        await expect(titleInput).toHaveValue(titles[8]);
        await expect(
          nav.getByRole("button", { name: titles[8] }),
        ).toHaveAttribute("aria-current", "true");
      });
    },
  );
});
