import { expect, test, type Page } from "@playwright/test";
import {
  authorActiveQuestionnaire,
  importQuestionsInStudio,
  newEncounter,
  openFormFromEncounter,
  saveStudio,
  selectInOutline,
} from "tests/helper/authoredForms";
import {
  expectFieldError,
  submitAndExpectSuccess,
  submitForm,
  verifyLabelledValues,
} from "tests/helper/questionnaire";
import {
  expectQuestionBlock,
  getQuestionnaireViaApi,
  questionBlock,
} from "tests/helper/questionnaireV2";

test.use({ storageState: "tests/.auth/user.json" });

const CHOICE_OPTIONS = [{ value: "Left" }, { value: "Right" }];

/** One question per answer type; bracketed labels so none is a substring of
 *  another when the Updates rows are matched. */
function questionsFor(types: string[], stamp: number) {
  return types.map((type) => ({
    text: `Flag (${type}) ${stamp}`,
    type,
    link_id: `flag_${type.toLowerCase()}`,
    ...(type === "choice" ? { answer_option: CHOICE_OPTIONS } : {}),
  }));
}

async function toggleFlagInStudio(
  page: Page,
  titles: string[],
  flag: "Required" | "Read only" | "Repeatable",
) {
  const box = page.getByRole("checkbox", { name: flag, exact: true });
  for (const title of titles) {
    await selectInOutline(page, title);
    await box.click();
    await expect(box).toHaveAttribute("aria-checked", "true");
  }
}

function trackBatchPosts(page: Page) {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/batch_requests/")
    ) {
      posts.push(request.url());
    }
  });
  return posts;
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

/** Answers one question of the given type with a representative value. */
async function answer(page: Page, type: string, label: string) {
  const block = questionBlock(page, label);
  switch (type) {
    case "string":
    case "text":
      return block.getByRole("textbox").fill("answered");
    case "url":
      return block.getByRole("textbox").fill("https://example.org");
    case "integer":
    case "decimal":
      return block.getByRole("spinbutton").fill("7");
    case "boolean":
      return block.getByRole("radio", { name: "No", exact: true }).click();
    case "date":
      return pickFifteenth(page, label);
    case "dateTime":
      await pickFifteenth(page, label);
      return block.locator('input[type="time"]').fill("10:15");
    case "time":
      return block.locator('input[type="time"]').fill("06:00");
    case "choice":
      return block.getByRole("radio", { name: "Right", exact: true }).click();
  }
}

test.describe("Behaviour flags set in the studio, enforced on an encounter", () => {
  test("Required blocks an empty submit for every answer type until each is answered", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Required Types ${stamp}`;
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
    ];
    const questions = questionsFor(types, stamp);
    const labels = questions.map((q) => q.text);
    const posts = trackBatchPosts(page);
    let id = "";

    await test.step("Author the types, then mark each Required in the inspector", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, questions);
      await toggleFlagInStudio(page, labels, "Required");
      await saveStudio(page);
      const saved = await getQuestionnaireViaApi(id);
      expect(saved.questions.map((q) => q.required)).toEqual(
        types.map(() => true),
      );
    });

    const encounter = await newEncounter();
    await openFormFromEncounter(page, encounter, title);

    await test.step("Submitting blank flags every question and sends nothing", async () => {
      await submitForm(page);
      for (const label of labels) {
        await expectFieldError(page, label);
      }
      expect(posts).toHaveLength(0);
    });

    await test.step("Answering all but one still blocks, and only that one stays flagged", async () => {
      const [firstType, ...restTypes] = types;
      const [firstLabel, ...restLabels] = labels;
      for (const [index, type] of restTypes.entries()) {
        await answer(page, type, restLabels[index]);
      }
      await submitForm(page);
      await expectFieldError(page, firstLabel);
      for (const label of restLabels) {
        await expect(
          questionBlock(page, label).locator("p.text-red-600"),
        ).toHaveCount(0);
      }
      expect(posts).toHaveLength(0);

      await answer(page, firstType, firstLabel);
      await submitAndExpectSuccess(page);
      expect(posts).toHaveLength(1);
    });

    await test.step("The encounter records every required answer", async () => {
      await verifyLabelledValues(page, [
        [labels[types.indexOf("string")], "answered"],
        [labels[types.indexOf("integer")], "7"],
        [labels[types.indexOf("boolean")], "No"],
        [labels[types.indexOf("time")], "06:00"],
        [labels[types.indexOf("choice")], "Right"],
      ]);
    });
  });

  test("Read only locks every answer type's control and takes no note, while other questions submit", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Read Only Types ${stamp}`;
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
    ];
    const questions = questionsFor(types, stamp);
    const labels = questions.map((q) => q.text);
    const editable = `Editable ${stamp}`;
    let id = "";

    await test.step("Author the types plus one editable question; mark the types Read only", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        ...questions,
        { text: editable, type: "string", link_id: "editable" },
      ]);
      await toggleFlagInStudio(page, labels, "Read only");
      await saveStudio(page);
      const saved = await getQuestionnaireViaApi(id);
      expect(saved.questions.map((q) => q.read_only === true)).toEqual([
        ...types.map(() => true),
        false,
      ]);
    });

    const encounter = await newEncounter();
    await openFormFromEncounter(page, encounter, title);

    await test.step("Every read-only control is disabled and offers no note", async () => {
      for (const label of labels) {
        const block = await expectQuestionBlock(page, label);
        const controls = block.locator(
          'input, textarea, button, [role="radio"], [role="combobox"]',
        );
        expect(await controls.count()).toBeGreaterThan(0);
        for (const control of await controls.all()) {
          await expect(control).toBeDisabled();
        }
        await expect(
          block.getByRole("button", { name: "Add note" }),
        ).toHaveCount(0);
      }
    });

    await test.step("The editable question still takes input and a note", async () => {
      const block = await expectQuestionBlock(page, editable);
      await expect(block.getByRole("textbox")).toBeEnabled();
      await block.getByRole("textbox").fill(`free ${stamp}`);
      await expect(
        block.getByRole("button", { name: "Add note" }),
      ).toBeEnabled();
    });

    await test.step("Submit records the editable answer and nothing for the locked ones", async () => {
      await submitAndExpectSuccess(page);
      await verifyLabelledValues(page, [[editable, `free ${stamp}`]]);
      for (const label of labels) {
        await expect(page.locator("td").filter({ hasText: label })).toHaveCount(
          0,
        );
      }
    });
  });

  test("Repeatable gives each repeatable type Add Another and Remove, and every kept entry submits", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Repeatable Types ${stamp}`;
    const entries: Record<string, [string, string, string]> = {
      string: ["alpha", "beta", "dropped"],
      text: ["first note", "second note", "dropped note"],
      url: ["https://a.example", "https://b.example", "https://c.example"],
      integer: ["1", "2", "3"],
      decimal: ["1.5", "2.5", "3.5"],
      time: ["08:00", "20:00", "23:00"],
    };
    const types = Object.keys(entries);
    const questions = questionsFor(types, stamp);
    const labels = questions.map((q) => q.text);
    const control = (type: string) =>
      type === "integer" || type === "decimal"
        ? 'input[type="number"]'
        : type === "time"
          ? 'input[type="time"]'
          : "input, textarea";
    let id = "";

    await test.step("Author the types and mark each Repeatable", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, questions);
      await toggleFlagInStudio(page, labels, "Repeatable");
      await saveStudio(page);
      const saved = await getQuestionnaireViaApi(id);
      expect(saved.questions.map((q) => q.repeats)).toEqual(
        types.map(() => true),
      );
    });

    const encounter = await newEncounter();
    await openFormFromEncounter(page, encounter, title);

    await test.step("Add two more entries, then remove the third", async () => {
      for (const [index, type] of types.entries()) {
        const block = questionBlock(page, labels[index]);
        const inputs = block.locator(control(type));
        await block.scrollIntoViewIfNeeded();
        await expect(inputs).toHaveCount(1);
        // A single entry has nothing to remove.
        await expect(
          block.getByRole("button", { name: "Remove", exact: true }),
        ).toHaveCount(0);

        await inputs.nth(0).fill(entries[type][0]);
        await block.getByRole("button", { name: "Add Another" }).click();
        await inputs.nth(1).fill(entries[type][1]);
        await block.getByRole("button", { name: "Add Another" }).click();
        await inputs.nth(2).fill(entries[type][2]);
        await expect(inputs).toHaveCount(3);

        await block
          .getByRole("button", { name: "Remove", exact: true })
          .nth(2)
          .click();
        await expect(inputs).toHaveCount(2);
        await expect(inputs.nth(0)).toHaveValue(entries[type][0]);
        await expect(inputs.nth(1)).toHaveValue(entries[type][1]);
      }
    });

    await test.step("The encounter shows both kept entries and not the removed one", async () => {
      await submitAndExpectSuccess(page);
      await verifyLabelledValues(
        page,
        types.map((type, index) => [
          labels[index],
          `${entries[type][0]}, ${entries[type][1]}`,
        ]),
      );
      for (const [index, type] of types.entries()) {
        const valueCell = page
          .locator("tr", {
            has: page.locator("td", { hasText: labels[index] }),
          })
          .first()
          .locator("td")
          .nth(1);
        await expect(valueCell).toHaveText(
          `${entries[type][0]}, ${entries[type][1]}`,
        );
      }
    });
  });
});
