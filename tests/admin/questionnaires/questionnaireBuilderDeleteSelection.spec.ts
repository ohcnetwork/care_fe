import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

/** Imports flat string questions into the freshly-opened builder. */
async function importStringQuestions(
  page: Page,
  titles: string[],
): Promise<void> {
  await page.getByRole("button", { name: "Import Questions" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "scaffold.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        questions: titles.map((text, index) => ({
          text,
          type: "string",
          link_id: `q-${index}`,
        })),
      }),
    ),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expectToast(page, "Questionnaire Imported Successfully");
}

test.describe("Questionnaire v2 builder — selection after delete", () => {
  test("deleting the last of 10 questions selects the 9th question, not the first", async ({
    page,
  }) => {
    const stamp = Date.now();
    const titles = Array.from({ length: 10 }, (_, i) => `Q${i + 1} ${stamp}`);
    const nav = page.getByRole("navigation");
    const titleInput = page.getByRole("textbox", { name: "Question Title" });

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: "/admin/questionnaires",
      title: `QV2 Del ${stamp}`,
    });
    await importStringQuestions(page, titles);

    await test.step("Select the 10th (last) question", async () => {
      await nav.getByRole("button", { name: titles[9] }).click();
      await expect(titleInput).toHaveValue(titles[9]);
    });

    await test.step("Deleting it selects the 9th question, not the first", async () => {
      await page.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Delete question" }).click();
      await expect(
        nav.getByRole("button", { name: titles[9] }),
      ).not.toBeVisible();

      // Regression: the reducer's removeQuestions fell back to
      // `questions[0]` on any deletion of the selected question, jumping
      // to the first question/section instead of the new last sibling.
      await expect(titleInput).toHaveValue(titles[8]);
      await expect(
        nav.getByRole("button", { name: titles[8] }),
      ).toHaveAttribute("aria-current", "true");
    });
  });
});
