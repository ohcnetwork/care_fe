import { expect, test, type Page } from "@playwright/test";
import {
  authorActiveQuestionnaire,
  importQuestionsInStudio,
  newEncounter,
  openFormFromEncounter,
  saveStudio,
} from "tests/helper/authoredForms";
import {
  selectBooleanOption,
  submitAndExpectSuccess,
} from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireViaApi,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

/** The message param's label on the instruction the backend registers. */
async function messageParamLabel(): Promise<string> {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/action_configuration/instructions/`,
    { headers: adminApiHeaders() },
  );
  const { instructions } = (await res.json()) as {
    instructions: {
      slug: string;
      input_schema: { properties?: Record<string, { title?: string }> };
    }[];
  };
  const instruction =
    instructions.find((entry) => entry.slug === "show_message") ??
    instructions[0];
  if (!instruction) throw new Error("No action instructions registered");
  const [name, schema] = Object.entries(
    instruction.input_schema.properties ?? {},
  )[0];
  return schema.title ?? name;
}

/** Adds an instruction step when the new slot isn't preselected. */
async function addMessageStep(page: Page, label: string, index: number) {
  const inputs = page.getByRole("textbox", { name: label });
  if ((await inputs.count()) <= index) {
    await page.getByRole("button", { name: "Add instruction" }).click();
  }
  if ((await inputs.count()) <= index) {
    await page.getByRole("combobox", { name: "Instruction" }).last().click();
    await page.getByRole("option").first().click();
  }
  await expect(inputs).toHaveCount(index + 1);
  return inputs.nth(index);
}

function toaster(page: Page) {
  return page.locator(".toaster.group");
}

test.describe("Actions authored in the studio, run on an encounter submission", () => {
  test("only the actions whose authored condition holds fire, each running every one of its steps", async ({
    page,
  }) => {
    const label = await messageParamLabel();
    const stamp = Date.now();
    const title = `QV2 Studio Actions ${stamp}`;
    const escalate = `Needs escalation ${stamp}`;
    const triage = `Triage colour ${stamp}`;
    const messages = {
      first: `escalate-first-${stamp}`,
      second: `escalate-second-${stamp}`,
      green: `triage-green-${stamp}`,
    };
    let id = "";

    await test.step("Author a boolean and a choice question", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        { text: escalate, type: "boolean", link_id: "escalate" },
        {
          text: triage,
          type: "choice",
          link_id: "triage",
          answer_option: [{ value: "Red" }, { value: "Green" }],
        },
      ]);
      await page.getByRole("button", { name: /^Actions\b/ }).click();
    });

    await test.step("Action 1: escalation is Yes → two message steps", async () => {
      await page.getByRole("button", { name: "Add action" }).click();
      await (await addMessageStep(page, label, 0)).fill(messages.first);
      await (await addMessageStep(page, label, 1)).fill(messages.second);
      await page.getByRole("button", { name: "Add a condition" }).click();
      await expect(
        page.getByRole("combobox", { name: "Condition 1 Field" }),
      ).toContainText(escalate);
      await expect(
        page.getByRole("combobox", { name: "Condition 1 Value" }),
      ).toContainText("Yes");
    });

    await test.step("Action 2: triage is Green → one message step", async () => {
      await page.getByRole("button", { name: "Add action" }).click();
      await (await addMessageStep(page, label, 0)).fill(messages.green);
      await page.getByRole("button", { name: "Add a condition" }).click();
      await page.getByRole("combobox", { name: "Condition 1 Field" }).click();
      await page.getByRole("option", { name: triage }).click();
      await page.getByRole("combobox", { name: "Condition 1 Value" }).click();
      await page.getByRole("option", { name: "Green", exact: true }).click();
      await saveStudio(page);
    });

    await test.step("The server stored both actions with their steps", async () => {
      const { actions } = (await getQuestionnaireViaApi(id)) as unknown as {
        actions: { condition: string; instructions: unknown[] }[];
      };
      expect(actions).toHaveLength(2);
      expect(actions[0].condition).toMatch(/== True$/);
      expect(actions[0].instructions).toHaveLength(2);
      expect(actions[1].condition).toMatch(/Green/);
      expect(actions[1].instructions).toHaveLength(1);
    });

    await test.step("Encounter: Yes + Red fires both steps of action 1 and not action 2", async () => {
      const encounter = await newEncounter();
      await openFormFromEncounter(page, encounter, title);
      await selectBooleanOption(page, escalate, "Yes");
      await questionBlock(page, triage)
        .getByRole("radio", { name: "Red", exact: true })
        .click();
      await submitAndExpectSuccess(page);
      await expectToast(page, messages.first);
      await expectToast(page, messages.second);
      await expect(toaster(page).getByText(messages.green)).toHaveCount(0);
    });

    await test.step("Another encounter: No + Green fires only action 2", async () => {
      const encounter = await newEncounter();
      await openFormFromEncounter(page, encounter, title);
      await selectBooleanOption(page, escalate, "No");
      await questionBlock(page, triage)
        .getByRole("radio", { name: "Green", exact: true })
        .click();
      await submitAndExpectSuccess(page);
      await expectToast(page, messages.green);
      await expect(toaster(page).getByText(messages.first)).toHaveCount(0);
      await expect(toaster(page).getByText(messages.second)).toHaveCount(0);
    });
  });
});
