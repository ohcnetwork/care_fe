import { expect, test, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {
  authorActiveQuestionnaire,
  encounterPath,
  importQuestionsInStudio,
  newEncounter,
  openFormFromEncounter,
  pickQuestionType,
  saveStudio,
} from "tests/helper/authoredForms";
import {
  submitAndExpectSuccess,
  verifyLabelledValues,
} from "tests/helper/questionnaire";
import {
  addTopLevelQuestion,
  expectQuestionBlock,
  getQuestionnaireViaApi,
  questionBlock,
} from "tests/helper/questionnaireV2";

test.use({ storageState: "tests/.auth/user.json" });

/** The renderer's chip/dropdown threshold, read from the source so the
 *  boundary cases follow the constant instead of a copy of it. */
const INLINE_CHOICE_MAX = Number(
  /INLINE_CHOICE_MAX\s*=\s*(\d+)/.exec(
    fs.readFileSync(
      path.resolve(
        "src/components/QuestionnaireV2/form/engine/inputs/FixedChoiceInput.tsx",
      ),
      "utf-8",
    ),
  )?.[1],
);

/** The 15th of the current month — the date picker opens on today. */
function fifteenthOfThisMonth() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `15/${mm}/${now.getFullYear()}`;
}

async function pickFifteenth(page: Page, label: string) {
  await questionBlock(page, label)
    .getByRole("button", { name: "Pick a date", exact: true })
    .click();
  await page
    .getByRole("gridcell")
    .getByRole("button", { name: /(^|\D)15(\D|$)/ })
    .first()
    .click();
  await page.keyboard.press("Escape");
}

test.describe("Answer types authored in the studio, answered on an encounter", () => {
  test("every answer type authored through the type picker is answerable and shows on the encounter", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Answer Types ${stamp}`;
    // Bracketed so no label is a substring of another (row matching is a
    // case-insensitive substring: "time answer" sits inside "dateTime answer").
    const label = (type: string) => `Answer (${type}) ${stamp}`;
    const options = ["Red", "Green", "Blue"];
    const types = [
      "string",
      "text",
      "url",
      "integer",
      "decimal",
      "boolean",
      "date",
      "dateTime",
      "time",
      "choice",
      "display",
    ];
    let id = "";

    await test.step("Author one question per answer type in the studio", async () => {
      id = await authorActiveQuestionnaire(page, title);
      for (const type of types) {
        await addTopLevelQuestion(page, label(type));
        await pickQuestionType(page, type);
        if (type === "choice") {
          const rows = page.getByRole("row");
          for (const value of options) {
            await page.getByRole("button", { name: "Add Option" }).click();
            await rows.last().getByRole("textbox").fill(value);
          }
        }
      }
      await saveStudio(page);
    });

    await test.step("The server stored each question with its type", async () => {
      const { questions } = await getQuestionnaireViaApi(id);
      expect(questions.map((q) => [q.text, q.type])).toEqual(
        types.map((type) => [label(type), type]),
      );
      const choice = questions.find((q) => q.type === "choice")!;
      expect(
        (choice.answer_option as { value: string }[]).map((o) => o.value),
      ).toEqual(options);
    });

    const encounter = await newEncounter();

    await test.step("Open it from the encounter's Forms picker", async () => {
      await openFormFromEncounter(page, encounter, title);
      await expect(page).toHaveURL(
        `${encounterPath(encounter)}/questionnaire/${id}`,
      );
    });

    await test.step("Each type renders its own control; display has none", async () => {
      await expect(
        questionBlock(page, label("string")).locator('input[type="text"]'),
      ).toBeVisible();
      await expect(
        questionBlock(page, label("text")).locator("textarea"),
      ).toBeVisible();
      await expect(
        questionBlock(page, label("url")).locator('input[type="url"]'),
      ).toBeVisible();
      for (const type of ["integer", "decimal"]) {
        await expect(
          questionBlock(page, label(type)).getByRole("spinbutton"),
        ).toBeVisible();
      }
      await expect(
        questionBlock(page, label("boolean")).getByRole("radio"),
      ).toHaveCount(2);
      await expect(
        questionBlock(page, label("time")).locator('input[type="time"]'),
      ).toBeVisible();
      await expect(
        questionBlock(page, label("choice")).getByRole("radio"),
      ).toHaveCount(options.length);
      const display = await expectQuestionBlock(page, label("display"));
      await expect(display.locator("input, textarea")).toHaveCount(0);
      await expect(
        display.getByRole("button", { name: "Add note" }),
      ).toHaveCount(0);
    });

    await test.step("Answer every type and submit", async () => {
      await questionBlock(page, label("string"))
        .getByRole("textbox")
        .fill(`plain ${stamp}`);
      await questionBlock(page, label("text"))
        .getByRole("textbox")
        .fill(`long form ${stamp}`);
      await questionBlock(page, label("url"))
        .getByRole("textbox")
        .fill("https://example.org/care");
      await questionBlock(page, label("integer"))
        .getByRole("spinbutton")
        .fill("42");
      await questionBlock(page, label("decimal"))
        .getByRole("spinbutton")
        .fill("37.5");
      await questionBlock(page, label("boolean"))
        .getByRole("radio", { name: "Yes", exact: true })
        .click();
      await pickFifteenth(page, label("date"));
      await pickFifteenth(page, label("dateTime"));
      await questionBlock(page, label("dateTime"))
        .locator('input[type="time"]')
        .fill("09:30");
      await questionBlock(page, label("time"))
        .locator('input[type="time"]')
        .fill("14:45");
      await questionBlock(page, label("choice"))
        .getByRole("radio", { name: "Green", exact: true })
        .click();
      await submitAndExpectSuccess(page);
    });

    await test.step("The encounter lists every answer against its question", async () => {
      const date = fifteenthOfThisMonth();
      await verifyLabelledValues(page, [
        [label("string"), `plain ${stamp}`],
        [label("text"), `long form ${stamp}`],
        [label("url"), "https://example.org/care"],
        [label("integer"), "42"],
        [label("decimal"), "37.5"],
        [label("boolean"), "Yes"],
        [label("date"), date],
        [label("dateTime"), `09:30 AM; ${date}`],
        [label("time"), "14:45"],
        [label("choice"), "Green"],
      ]);
      // A display question records nothing, so it gets no answer row.
      await expect(
        page.locator("td").filter({ hasText: label("display") }),
      ).toHaveCount(0);
    });
  });

  test("choice options render as chips up to the inline limit and as a dropdown past it", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Choice Layout ${stamp}`;
    const options = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ value: `Pick ${i + 1}` }));
    const single = `Single option ${stamp}`;
    const atLimit = `At the limit ${stamp}`;
    const overLimit = `Over the limit ${stamp}`;
    const multiAtLimit = `Many at the limit ${stamp}`;
    const multiOverLimit = `Many over the limit ${stamp}`;

    expect(INLINE_CHOICE_MAX).toBeGreaterThan(1);

    await test.step("Author the boundary cases in the studio", async () => {
      await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        {
          text: single,
          type: "choice",
          link_id: "one",
          answer_option: options(1),
        },
        {
          text: atLimit,
          type: "choice",
          link_id: "at",
          answer_option: options(INLINE_CHOICE_MAX),
        },
        {
          text: overLimit,
          type: "choice",
          link_id: "over",
          answer_option: options(INLINE_CHOICE_MAX + 1),
        },
        {
          text: multiAtLimit,
          type: "choice",
          link_id: "multi_at",
          repeats: true,
          answer_option: options(INLINE_CHOICE_MAX),
        },
        {
          text: multiOverLimit,
          type: "choice",
          link_id: "multi_over",
          repeats: true,
          answer_option: options(INLINE_CHOICE_MAX + 1),
        },
      ]);
      await saveStudio(page);
    });

    const encounter = await newEncounter();
    await openFormFromEncounter(page, encounter, title);

    await test.step("Up to the limit: one chip per option, no dropdown", async () => {
      await expect(questionBlock(page, single).getByRole("radio")).toHaveCount(
        1,
      );
      await expect(questionBlock(page, atLimit).getByRole("radio")).toHaveCount(
        INLINE_CHOICE_MAX,
      );
      await expect(
        questionBlock(page, multiAtLimit).getByRole("checkbox"),
      ).toHaveCount(INLINE_CHOICE_MAX);
      for (const label of [single, atLimit, multiAtLimit]) {
        await expect(
          questionBlock(page, label).getByRole("combobox"),
        ).toHaveCount(0);
      }
    });

    await test.step("One past the limit: a dropdown, no chips", async () => {
      for (const label of [overLimit, multiOverLimit]) {
        await expect(
          questionBlock(page, label).getByRole("combobox"),
        ).toBeVisible();
        await expect(questionBlock(page, label).getByRole("radio")).toHaveCount(
          0,
        );
        await expect(
          questionBlock(page, label).getByRole("checkbox"),
        ).toHaveCount(0);
      }
    });

    await test.step("Answer each layout and submit", async () => {
      await questionBlock(page, single)
        .getByRole("radio", { name: "Pick 1", exact: true })
        .click();
      await questionBlock(page, atLimit)
        .getByRole("radio", { name: `Pick ${INLINE_CHOICE_MAX}`, exact: true })
        .click();
      await questionBlock(page, multiAtLimit)
        .getByRole("checkbox", { name: "Pick 1", exact: true })
        .click();
      await questionBlock(page, multiAtLimit)
        .getByRole("checkbox", { name: "Pick 2", exact: true })
        .click();
      await questionBlock(page, overLimit).getByRole("combobox").click();
      await page
        .getByRole("option", {
          name: `Pick ${INLINE_CHOICE_MAX + 1}`,
          exact: true,
        })
        .click();
      await questionBlock(page, multiOverLimit).getByRole("combobox").click();
      await page
        .getByRole("option", {
          name: `Select Pick ${INLINE_CHOICE_MAX + 1}`,
          exact: true,
        })
        .click();
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await submitAndExpectSuccess(page);
    });

    await test.step("The encounter shows each chosen option", async () => {
      await verifyLabelledValues(page, [
        [single, "Pick 1"],
        [atLimit, `Pick ${INLINE_CHOICE_MAX}`],
        [multiAtLimit, "Pick 1, Pick 2"],
        [overLimit, `Pick ${INLINE_CHOICE_MAX + 1}`],
        [multiOverLimit, `Pick ${INLINE_CHOICE_MAX + 1}`],
      ]);
    });
  });
});
