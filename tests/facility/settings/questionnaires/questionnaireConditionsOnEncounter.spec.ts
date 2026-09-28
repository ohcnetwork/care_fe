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
  checkVisibility,
  selectBooleanOption,
  submitAndExpectSuccess,
  verifyLabelledValues,
} from "tests/helper/questionnaire";
import {
  getQuestionnaireViaApi,
  questionBlock,
} from "tests/helper/questionnaireV2";

test.use({ storageState: "tests/.auth/user.json" });

const NUMERIC_OPERATORS = [
  "Greater Than",
  "Less Than",
  "Greater Than or Equal",
  "Less Than or Equal",
  "Equals",
  "Not Equals",
  "Exists",
];
const EQUALITY_OPERATORS = ["Equals", "Not Equals", "Exists"];

/** The condition editor's field grid (target / operator / answer). */
function conditionRow(page: Page, index: number) {
  return page.locator('div[class*="sm:grid-cols-2"]').nth(index);
}

interface ConditionSpec {
  target: string;
  operator: string;
  /** number → spinbutton, select → Yes/No or Has an answer, text → textbox */
  answer: { kind: "number" | "select" | "text"; value: string };
}

/** Adds condition `index` to the selected question in the Logic tab. */
async function addCondition(
  page: Page,
  index: number,
  { target, operator, answer }: ConditionSpec,
) {
  await page.getByRole("button", { name: "Add a condition" }).click();
  const row = conditionRow(page, index);
  const fields = row.getByRole("combobox");
  await fields.nth(0).click();
  await page.getByRole("option", { name: target, exact: true }).click();
  await fields.nth(1).click();
  await page.getByRole("option", { name: operator, exact: true }).click();
  if (answer.kind === "number") {
    await row.getByRole("spinbutton").fill(answer.value);
  } else if (answer.kind === "text") {
    await row.getByRole("textbox").fill(answer.value);
  } else {
    await fields.nth(2).click();
    await page.getByRole("option", { name: answer.value, exact: true }).click();
  }
}

/** Opens the Logic tab of `dependent`. */
async function openLogic(page: Page, dependent: string) {
  await selectInOutline(page, dependent);
  await page.getByRole("tab", { name: "Logic" }).click();
}

async function operatorOptions(page: Page, target: string) {
  await page.getByRole("button", { name: "Add a condition" }).click();
  const fields = conditionRow(page, 0).getByRole("combobox");
  await fields.nth(0).click();
  await page.getByRole("option", { name: target, exact: true }).click();
  await fields.nth(1).click();
  const names = await page.getByRole("option").allTextContents();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  return names.map((name) => name.trim());
}

test.describe("Visibility conditions authored in the studio, evaluated on an encounter", () => {
  test("the operator list follows the target question's answer type", async ({
    page,
  }) => {
    const stamp = Date.now();
    const targets = {
      integer: `Target integer ${stamp}`,
      decimal: `Target decimal ${stamp}`,
      boolean: `Target boolean ${stamp}`,
      string: `Target string ${stamp}`,
      choice: `Target choice ${stamp}`,
      date: `Target date ${stamp}`,
    };
    const dependent = `Dependent ${stamp}`;

    await authorActiveQuestionnaire(page, `QV2 Operator Lists ${stamp}`);
    await importQuestionsInStudio(page, [
      ...Object.entries(targets).map(([type, text]) => ({
        text,
        type,
        link_id: `t_${type}`,
        ...(type === "choice" ? { answer_option: [{ value: "One" }] } : {}),
      })),
      { text: dependent, type: "string", link_id: "dependent" },
    ]);
    await openLogic(page, dependent);

    for (const type of ["integer", "decimal"] as const) {
      expect(await operatorOptions(page, targets[type])).toEqual(
        NUMERIC_OPERATORS,
      );
    }
    for (const type of ["boolean", "string", "choice", "date"] as const) {
      expect(await operatorOptions(page, targets[type])).toEqual(
        expect.arrayContaining(EQUALITY_OPERATORS),
      );
      const options = await operatorOptions(page, targets[type]);
      expect(options).toHaveLength(EQUALITY_OPERATORS.length);
      expect(options).not.toContain("Greater Than");
    }
  });

  test("each numeric operator authored in the Logic tab shows its dependent only when it holds", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Numeric Operators ${stamp}`;
    const score = `Pain score ${stamp}`;
    const dependents: Record<string, string> = {
      "Greater Than": `Shown when above 5 ${stamp}`,
      "Less Than": `Shown when below 5 ${stamp}`,
      "Greater Than or Equal": `Shown when 5 or above ${stamp}`,
      "Less Than or Equal": `Shown when 5 or below ${stamp}`,
      Equals: `Shown when exactly 5 ${stamp}`,
      "Not Equals": `Shown when not 5 ${stamp}`,
      Exists: `Shown once scored ${stamp}`,
    };
    // Which dependents hold for each score (Exists holds for any answer).
    const truth: Record<string, string[]> = {
      "4": ["Less Than", "Less Than or Equal", "Not Equals", "Exists"],
      "5": ["Greater Than or Equal", "Less Than or Equal", "Equals", "Exists"],
      "6": ["Greater Than", "Greater Than or Equal", "Not Equals", "Exists"],
    };
    let id = "";

    await test.step("Author one dependent per operator against the score", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        { text: score, type: "integer", link_id: "score" },
        ...Object.values(dependents).map((text, index) => ({
          text,
          type: "string",
          link_id: `dep_${index}`,
        })),
      ]);
      for (const [operator, dependent] of Object.entries(dependents)) {
        await openLogic(page, dependent);
        await addCondition(page, 0, {
          target: score,
          operator,
          answer:
            operator === "Exists"
              ? { kind: "select", value: "Has an answer" }
              : { kind: "number", value: "5" },
        });
      }
      await saveStudio(page);
    });

    await test.step("The server stored each operator against the score", async () => {
      const { questions } = await getQuestionnaireViaApi(id);
      const scoreId = questions[0].link_id;
      expect(
        questions.slice(1).map((q) => (q.enable_when as object[])[0]),
      ).toEqual([
        expect.objectContaining({ question: scoreId, operator: "greater" }),
        expect.objectContaining({ question: scoreId, operator: "less" }),
        expect.objectContaining({
          question: scoreId,
          operator: "greater_or_equals",
        }),
        expect.objectContaining({
          question: scoreId,
          operator: "less_or_equals",
        }),
        expect.objectContaining({ question: scoreId, operator: "equals" }),
        expect.objectContaining({ question: scoreId, operator: "not_equals" }),
        expect.objectContaining({ question: scoreId, operator: "exists" }),
      ]);
    });

    const encounter = await newEncounter();
    await openFormFromEncounter(page, encounter, title);
    const scoreInput = questionBlock(page, score).getByRole("spinbutton");

    await test.step("Unanswered: the comparison and Exists dependents stay hidden", async () => {
      await expect(scoreInput).toBeVisible();
      for (const operator of [
        "Greater Than",
        "Less Than",
        "Greater Than or Equal",
        "Less Than or Equal",
        "Equals",
        "Exists",
      ]) {
        await checkVisibility(page, dependents[operator], false);
      }
    });

    for (const value of ["4", "5", "6"]) {
      await test.step(`Score ${value}: exactly the holding operators show`, async () => {
        await scoreInput.fill(value);
        for (const [operator, dependent] of Object.entries(dependents)) {
          await checkVisibility(
            page,
            dependent,
            truth[value].includes(operator),
          );
        }
      });
    }

    await test.step("An answer hidden by a later change is not submitted", async () => {
      await scoreInput.fill("4");
      await questionBlock(page, dependents["Less Than"])
        .getByRole("textbox")
        .fill(`low ${stamp}`);
      await scoreInput.fill("6");
      await checkVisibility(page, dependents["Less Than"], false);
      await questionBlock(page, dependents["Greater Than"])
        .getByRole("textbox")
        .fill(`high ${stamp}`);
      await submitAndExpectSuccess(page);
      await verifyLabelledValues(page, [
        [score, "6"],
        [dependents["Greater Than"], `high ${stamp}`],
      ]);
      await expect(page.getByText(`low ${stamp}`)).toHaveCount(0);
    });
  });

  test("AND of a boolean and a choice condition needs both before the dependent shows", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 AND Conditions ${stamp}`;
    const consent = `Consent given ${stamp}`;
    const severity = `Severity ${stamp}`;
    const dependent = `Escalation plan ${stamp}`;
    let id = "";

    await test.step("Author two conditions joined by AND", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        { text: consent, type: "boolean", link_id: "consent" },
        {
          text: severity,
          type: "choice",
          link_id: "severity",
          answer_option: [{ value: "Mild" }, { value: "Severe" }],
        },
        { text: dependent, type: "string", link_id: "plan" },
      ]);
      await openLogic(page, dependent);
      await addCondition(page, 0, {
        target: consent,
        operator: "Equals",
        answer: { kind: "select", value: "Yes" },
      });
      await addCondition(page, 1, {
        target: severity,
        operator: "Equals",
        answer: { kind: "text", value: "Severe" },
      });
      await page
        .getByRole("radio", { name: "All conditions are true (AND)" })
        .click();
      await saveStudio(page);
      const { questions } = await getQuestionnaireViaApi(id);
      expect(questions[2]).toMatchObject({ enable_behavior: "all" });
      expect(questions[2].enable_when).toHaveLength(2);
    });

    const encounter = await newEncounter();
    await openFormFromEncounter(page, encounter, title);
    const severityChip = (value: string) =>
      questionBlock(page, severity).getByRole("radio", {
        name: value,
        exact: true,
      });

    await test.step("Neither, or only one, leaves it hidden", async () => {
      await checkVisibility(page, dependent, false);
      await selectBooleanOption(page, consent, "Yes");
      await checkVisibility(page, dependent, false);
      await severityChip("Mild").click();
      await checkVisibility(page, dependent, false);
      await selectBooleanOption(page, consent, "No");
      await severityChip("Severe").click();
      await checkVisibility(page, dependent, false);
    });

    await test.step("Both together show it; the answer reaches the encounter", async () => {
      await selectBooleanOption(page, consent, "Yes");
      await checkVisibility(page, dependent, true);
      await questionBlock(page, dependent)
        .getByRole("textbox")
        .fill(`ICU review ${stamp}`);
      await submitAndExpectSuccess(page);
      await verifyLabelledValues(page, [
        [consent, "Yes"],
        [severity, "Severe"],
        [dependent, `ICU review ${stamp}`],
      ]);
    });
  });

  test("ANY of three conditions on text, number and boolean shows the dependent when any one holds", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 ANY Conditions ${stamp}`;
    const triage = `Triage note ${stamp}`;
    const pulse = `Pulse rate ${stamp}`;
    const bleeding = `Active bleeding ${stamp}`;
    const dependent = `Senior review ${stamp}`;
    let id = "";

    await test.step("Author three conditions joined by OR", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        { text: triage, type: "string", link_id: "triage" },
        { text: pulse, type: "integer", link_id: "pulse" },
        { text: bleeding, type: "boolean", link_id: "bleeding" },
        { text: dependent, type: "string", link_id: "review" },
      ]);
      await openLogic(page, dependent);
      await addCondition(page, 0, {
        target: triage,
        operator: "Equals",
        answer: { kind: "text", value: "urgent" },
      });
      await addCondition(page, 1, {
        target: pulse,
        operator: "Greater Than",
        answer: { kind: "number", value: "120" },
      });
      await addCondition(page, 2, {
        target: bleeding,
        operator: "Equals",
        answer: { kind: "select", value: "Yes" },
      });
      await page
        .getByRole("radio", { name: "Any condition is true (OR)" })
        .click();
      await saveStudio(page);
      const { questions } = await getQuestionnaireViaApi(id);
      expect(questions[3]).toMatchObject({ enable_behavior: "any" });
      expect(questions[3].enable_when).toHaveLength(3);
    });

    const encounter = await newEncounter();
    await openFormFromEncounter(page, encounter, title);
    const triageInput = questionBlock(page, triage).getByRole("textbox");
    const pulseInput = questionBlock(page, pulse).getByRole("spinbutton");

    await test.step("No condition holding keeps it hidden", async () => {
      await triageInput.fill("routine");
      await pulseInput.fill("120");
      await selectBooleanOption(page, bleeding, "No");
      await checkVisibility(page, dependent, false);
    });

    await test.step("Each condition alone is enough", async () => {
      await triageInput.fill("urgent");
      await checkVisibility(page, dependent, true);
      await triageInput.fill("routine");
      await checkVisibility(page, dependent, false);

      await pulseInput.fill("121");
      await checkVisibility(page, dependent, true);
      await pulseInput.fill("120");
      await checkVisibility(page, dependent, false);

      await selectBooleanOption(page, bleeding, "Yes");
      await checkVisibility(page, dependent, true);
    });

    await test.step("Submit with one leg holding records the dependent's answer", async () => {
      await questionBlock(page, dependent)
        .getByRole("textbox")
        .fill(`seen ${stamp}`);
      await submitAndExpectSuccess(page);
      await verifyLabelledValues(page, [
        [bleeding, "Yes"],
        [dependent, `seen ${stamp}`],
      ]);
    });
  });
});
