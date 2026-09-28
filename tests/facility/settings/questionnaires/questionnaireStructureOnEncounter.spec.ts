import { expect, test, type Page } from "@playwright/test";
import {
  authorActiveQuestionnaire,
  importQuestionsInStudio,
  newEncounter,
  openFormFromEncounter,
  pickQuestionType,
  saveStudio,
  selectInOutline,
} from "tests/helper/authoredForms";
import {
  submitAndExpectSuccess,
  verifyLabelledValues,
} from "tests/helper/questionnaire";
import {
  getQuestionnaireViaApi,
  questionBlock,
} from "tests/helper/questionnaireV2";

test.use({ storageState: "tests/.auth/user.json" });

interface SavedQuestion {
  text: string;
  questions?: SavedQuestion[];
}

function tree(questions: SavedQuestion[]): unknown[] {
  return questions.map((q) =>
    q.questions?.length ? { [q.text]: tree(q.questions) } : q.text,
  );
}

/** The sub-question row in the selected group's editor. */
function subQuestionRow(page: Page, title: string) {
  return page
    .locator("div")
    .filter({ has: page.getByRole("checkbox", { name: title, exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Move Up" }) })
    .last();
}

/** Question labels in the order the fill page renders them. */
async function fillOrder(page: Page, titles: string[]) {
  const labels = await page
    .locator("[data-question-id] label")
    .allTextContents();
  return labels.map((l) => l.trim()).filter((l) => titles.includes(l));
}

async function moveTo(
  page: Page,
  title: string,
  target: string,
  position: number,
) {
  await page.getByRole("checkbox", { name: title, exact: true }).click();
  await page.getByRole("button", { name: "Move 1 question" }).click();
  const dialog = page.getByRole("dialog", { name: "Move 1 question" });
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: target, exact: true }).click();
  await dialog.getByRole("spinbutton").fill(String(position));
  await dialog.getByRole("button", { name: "Move", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

test.describe("Question structure authored in the studio, rendered on an encounter", () => {
  test("questions repositioned inside a group, into another group and out to the top level keep that order on the encounter", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Reorder ${stamp}`;
    const groupA = `Group Alpha ${stamp}`;
    const groupB = `Group Beta ${stamp}`;
    const [a1, a2, a3, a4] = [1, 2, 3, 4].map((n) => `Alpha ${n} ${stamp}`);
    const b1 = `Beta 1 ${stamp}`;
    const top = `Top question ${stamp}`;
    const leaves = [a1, a2, a3, a4, b1, top];
    let id = "";

    await test.step("Author two groups and a top-level question", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        {
          text: groupA,
          type: "group",
          link_id: "grp_a",
          questions: [a1, a2, a3, a4].map((text, i) => ({
            text,
            type: "string",
            link_id: `a${i + 1}`,
          })),
        },
        {
          text: groupB,
          type: "group",
          link_id: "grp_b",
          questions: [{ text: b1, type: "string", link_id: "b1" }],
        },
        { text: top, type: "string", link_id: "top" },
      ]);
    });

    await test.step("Inside Alpha: move the third up and the first down", async () => {
      await selectInOutline(page, groupA);
      await subQuestionRow(page, a3)
        .getByRole("button", { name: "Move Up" })
        .click();
      await subQuestionRow(page, a1)
        .getByRole("button", { name: "Move Down" })
        .click();
      // Alpha is now a3, a1, a2, a4.
      await expect(
        subQuestionRow(page, a3).getByRole("button", { name: "Move Up" }),
      ).toBeDisabled();
      await expect(
        subQuestionRow(page, a4).getByRole("button", { name: "Move Down" }),
      ).toBeDisabled();
    });

    await test.step("Out of Alpha: a2 goes after b1 in Beta, a4 to the top level", async () => {
      await moveTo(page, a2, groupB, 1);
      await selectInOutline(page, groupA);
      await moveTo(page, a4, "Top Level", 0);
      await saveStudio(page);
    });

    const expectedTree = [
      a4,
      { [groupA]: [a3, a1] },
      { [groupB]: [b1, a2] },
      top,
    ];

    await test.step("The server stored the new structure", async () => {
      const { questions } = await getQuestionnaireViaApi(id);
      expect(tree(questions as unknown as SavedQuestion[])).toEqual(
        expectedTree,
      );
    });

    const encounter = await newEncounter();

    await test.step("The encounter's fill page renders the same order", async () => {
      await openFormFromEncounter(page, encounter, title);
      await expect(questionBlock(page, top)).toBeVisible();
      expect(await fillOrder(page, leaves)).toEqual([a4, a3, a1, b1, a2, top]);
      const inGroup = (group: string, leaf: string) =>
        page
          .locator("[data-question-id]")
          .filter({ has: page.getByRole("heading", { name: group }) })
          .filter({ has: questionBlock(page, leaf) });
      await expect(inGroup(groupB, a2)).not.toHaveCount(0);
      await expect(inGroup(groupA, a2)).toHaveCount(0);
      await expect(inGroup(groupA, a4)).toHaveCount(0);
    });

    await test.step("Moved questions submit and show under their new parent", async () => {
      await questionBlock(page, a2).getByRole("textbox").fill(`moved ${stamp}`);
      await questionBlock(page, a4)
        .getByRole("textbox")
        .fill(`promoted ${stamp}`);
      await submitAndExpectSuccess(page);
      await verifyLabelledValues(page, [
        [a2, `moved ${stamp}`],
        [a4, `promoted ${stamp}`],
      ]);
      const betaCard = page
        .locator("div.border")
        .filter({ has: page.getByRole("heading", { name: groupB }) })
        .last();
      await expect(betaCard).toContainText(`moved ${stamp}`);
    });
  });

  test("groups nested two levels inside a group author in the studio and answer on the encounter", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Nested Groups ${stamp}`;
    const outer = `Outer section ${stamp}`;
    const middle = `Middle section ${stamp}`;
    const inner = `Inner section ${stamp}`;
    const leaf = `Deepest question ${stamp}`;
    const sibling = `Middle sibling ${stamp}`;
    const titleInput = page.getByRole("textbox", { name: "Question Title" });
    const nav = page.getByRole("navigation");
    let id = "";

    await test.step("Build Outer › Middle › Inner › question with the studio controls", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await nav.getByRole("button", { name: "Add Section" }).click();
      await titleInput.pressSequentially(outer);

      await page.getByRole("button", { name: "Add Sub-Question" }).click();
      await titleInput.pressSequentially(middle);
      await pickQuestionType(page, "group");

      await page.getByRole("button", { name: "Add Sub-Question" }).click();
      await titleInput.pressSequentially(inner);
      await pickQuestionType(page, "group");

      await page.getByRole("button", { name: "Add Sub-Question" }).click();
      await titleInput.pressSequentially(leaf);

      await selectInOutline(page, middle);
      await page.getByRole("button", { name: "Add Sub-Question" }).click();
      await titleInput.pressSequentially(sibling);
    });

    await test.step("The canvas numbers each level", async () => {
      // The Structure outline stops at two levels; the canvas shows all four.
      const canvas = page.getByRole("region", { name: "Form canvas" });
      await expect(nav.getByRole("button", { name: middle })).toContainText(
        "1.1.",
      );
      await expect(
        canvas.getByRole("heading", { name: `1.1.${middle}`, exact: true }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("heading", { name: `1.1.1.${inner}`, exact: true }),
      ).toBeVisible();
      await expect(canvas).toContainText(
        new RegExp(`1\\.1\\.1\\.1\\.\\s*${leaf}`),
      );
      await expect(canvas).toContainText(
        new RegExp(`1\\.1\\.2\\.\\s*${sibling}`),
      );
      await saveStudio(page);
    });

    await test.step("The server stored three levels of groups", async () => {
      const { questions } = await getQuestionnaireViaApi(id);
      expect(tree(questions as unknown as SavedQuestion[])).toEqual([
        { [outer]: [{ [middle]: [{ [inner]: [leaf] }, sibling] }] },
      ]);
    });

    const encounter = await newEncounter();

    await test.step("The encounter renders every level and takes both answers", async () => {
      await openFormFromEncounter(page, encounter, title);
      for (const heading of [outer, middle, inner]) {
        await expect(
          page.getByRole("heading", { name: heading }),
        ).toBeVisible();
      }
      await questionBlock(page, leaf)
        .getByRole("textbox")
        .fill(`deep ${stamp}`);
      await questionBlock(page, sibling)
        .getByRole("textbox")
        .fill(`shallow ${stamp}`);
      await submitAndExpectSuccess(page);
    });

    await test.step("The encounter shows the answers from both depths", async () => {
      await verifyLabelledValues(page, [
        [sibling, `shallow ${stamp}`],
        [leaf, `deep ${stamp}`],
      ]);
    });
  });

  test("an answer given only to the deepest question still shows on the encounter", async ({
    page,
  }) => {
    // Known bug: QuestionGroup.hasResponses (QuestionnaireResponsesList.tsx)
    // looks two levels down, so the outer group renders nothing.
    test.fail();
    const stamp = Date.now();
    const title = `QV2 Deep Only ${stamp}`;
    const leaf = `Only deep answer ${stamp}`;
    const answer = `alone ${stamp}`;

    await authorActiveQuestionnaire(page, title);
    await importQuestionsInStudio(page, [
      {
        text: `Outer ${stamp}`,
        type: "group",
        link_id: "outer",
        questions: [
          {
            text: `Middle ${stamp}`,
            type: "group",
            link_id: "middle",
            questions: [
              {
                text: `Inner ${stamp}`,
                type: "group",
                link_id: "inner",
                questions: [{ text: leaf, type: "string", link_id: "leaf" }],
              },
            ],
          },
        ],
      },
    ]);
    await saveStudio(page);

    const encounter = await newEncounter();
    await openFormFromEncounter(page, encounter, title);
    await questionBlock(page, leaf).getByRole("textbox").fill(answer);
    const batch = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/api/v1/batch_requests/"),
    );
    await submitAndExpectSuccess(page);
    expect((await batch).postData()).toContain(answer);
    await verifyLabelledValues(page, [[leaf, answer]]);
  });
});
