import { expect, test, type Page } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaireAndOpenBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

interface RegistryInstruction {
  slug: string;
  input_schema: { properties?: Record<string, { title?: string }> };
}

/** The message instruction the backend registers (`show_message`, falling
 *  back to whatever comes first) — read from the registry, never assumed. */
async function messageInstruction(): Promise<RegistryInstruction> {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/action_configuration/instructions/`,
    { headers: adminApiHeaders() },
  );
  if (!res.ok) throw new Error(`instructions endpoint: ${res.status}`);
  const data = (await res.json()) as { instructions: RegistryInstruction[] };
  if (data.instructions.length === 0) {
    throw new Error("The backend registers no action instructions");
  }
  return (
    data.instructions.find((entry) => entry.slug === "show_message") ??
    data.instructions[0]
  );
}

/**
 * Closes every toast on screen. Under the preview server a reload raises
 * the PWA's top-centre "Software Update" toast, which sits over the top
 * bar's issue button; a real user closes it, so does the spec.
 */
async function dismissToasts(page: Page): Promise<void> {
  const closeButtons = page.getByRole("button", { name: "Close toast" });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const count = await closeButtons.count();
    if (count === 0) return;
    await closeButtons.first().click();
    await page.waitForTimeout(300);
  }
}

/** Imports questions into the freshly-opened builder. */
async function importQuestions(page: Page, questions: object[]): Promise<void> {
  await page.getByRole("button", { name: "Import Questions" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "scaffold.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ questions })),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expectToast(page, "Questionnaire Imported Successfully");
}

async function fetchQuestionnaire(id: string) {
  const res = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/${id}/`, {
    headers: adminApiHeaders(),
  });
  if (!res.ok) throw new Error(`questionnaire GET: ${res.status}`);
  return (await res.json()) as {
    actions: {
      condition: string;
      instructions: { slug: string; params: Record<string, unknown> }[];
    }[];
  };
}

test.describe("Questionnaire v2 actions authoring", () => {
  test("authors a conditional action with an answer in its message, saves, reloads and gates save on issues", async ({
    page,
  }) => {
    const instruction = await messageInstruction();
    const paramName = Object.keys(instruction.input_schema.properties ?? {})[0];
    const paramLabel =
      instruction.input_schema.properties?.[paramName]?.title ?? paramName;
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const feverTitle = `Fever ${stamp}`;
    const tempTitle = `Temperature ${stamp}`;

    const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Actions ${stamp}`,
    });
    const questionnaireId = detailUrl.split("/").pop() as string;
    await importQuestions(page, [
      { text: feverTitle, type: "boolean", link_id: "fever", required: true },
      { text: tempTitle, type: "decimal", link_id: "temp", required: true },
    ]);

    const actionsRow = page.getByRole("button", { name: /^Actions\b/ });
    const messageInput = page.getByRole("textbox", { name: paramLabel });
    // Import regenerates link ids (identifier-safe `Q_xxxxxxxx`), so the
    // refs are read back from what the editor produced, not assumed.
    let tempRef = "";
    let feverRef = "";

    await test.step("The outline's Actions row opens the empty panel", async () => {
      await actionsRow.click();
      await expect(page.getByText("No actions yet")).toBeVisible();
      await page.getByRole("button", { name: "Add action" }).click();
      await expect(
        page.getByText("Runs on every submission").first(),
      ).toBeVisible();
    });

    await test.step("Pick the message instruction for the Then step", async () => {
      // With several registered instructions the new action starts with no
      // step; with exactly one it is preselected. Handle both.
      if (!(await messageInput.isVisible())) {
        await page.getByRole("button", { name: "Add instruction" }).click();
        await page.getByRole("combobox", { name: "Instruction" }).click();
        await page.getByRole("option", { name: /Show a message/ }).click();
      }
      await expect(messageInput).toBeVisible();
    });

    await test.step("The message can splice an answer in at the caret", async () => {
      await messageInput.fill("Temp is ");
      await page
        .getByRole("button", { name: "Insert an answer or patient detail" })
        .click();
      await page.getByRole("menuitem", { name: `2. ${tempTitle}` }).click();
      await expect(messageInput).toHaveValue(/^Temp is \{q_Q_[0-9a-f]{8}\}$/);
      tempRef = (await messageInput.inputValue()).match(/\{(q_\w+)\}/)![1];
      await expect(page.getByText("Preview:")).toBeVisible();
    });

    await test.step("A condition row defaults to the first answer", async () => {
      await page.getByRole("button", { name: "Add a condition" }).click();
      await expect(
        page.getByRole("combobox", { name: "Condition 1 Field" }),
      ).toContainText(feverTitle);
      await expect(
        page.getByRole("combobox", { name: "Condition 1 Value" }),
      ).toContainText("Yes");
    });

    await test.step("Save persists the compiled condition and template", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      const saved = await fetchQuestionnaire(questionnaireId);
      expect(saved.actions).toHaveLength(1);
      expect(saved.actions[0].condition).toMatch(/^q_Q_[0-9a-f]{8} == True$/);
      feverRef = saved.actions[0].condition.split(" ")[0];
      expect(saved.actions[0].instructions[0].slug).toBe(instruction.slug);
      expect(saved.actions[0].instructions[0].params[paramName]).toBe(
        `{{ f"Temp is {${tempRef}}" }}`,
      );
    });

    await test.step("After a reload the card summarises the action in plain words", async () => {
      await page.reload();
      await page.getByRole("button", { name: /^Actions\b/ }).click();
      const card = page.getByRole("button", { name: "Action 1", exact: true });
      await expect(card).toBeVisible();
      await expect(
        page.getByText(`“${feverTitle}” equals “Yes”`),
      ).toBeVisible();
      await card.click();
      await expect(messageInput).toHaveValue(`Temp is {${tempRef}}`);
    });

    await test.step("Removing the only step blocks Save through the issues popover", async () => {
      await page.getByRole("button", { name: "Remove step" }).click();
      await expect(
        page.getByRole("button", { name: "1 to fix" }),
      ).toBeVisible();
      await dismissToasts(page);
      await page.getByRole("button", { name: "1 to fix" }).click();
      await page
        .getByRole("button", { name: "An action needs at least one step" })
        .click();
      await page.getByRole("button", { name: "Add instruction" }).click();
      if (!(await messageInput.isVisible())) {
        await page.getByRole("combobox", { name: "Instruction" }).click();
        await page.getByRole("option", { name: /Show a message/ }).click();
      }
      await expect(messageInput).toBeVisible();
      await messageInput.fill("Restored");
      await expect(page.getByText("Ready to save")).toBeVisible();
    });

    await test.step("Expression mode round-trips and guards an unparsable edit", async () => {
      await page.getByRole("button", { name: "Edit as expression" }).click();
      const expression = page.getByRole("textbox", { name: "Expression" });
      await expect(expression).toHaveValue(`${feverRef} == True`);
      await expression.fill(`${feverRef} == True and (${tempRef} > 38)`);
      await page.getByRole("button", { name: "Back to conditions" }).click();
      await expect(
        page.getByText("This expression can't be shown as conditions", {
          exact: false,
        }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Keep expression" }).click();
      await expression.fill(`${feverRef} == True and ${tempRef} > 38`);
      await page.getByRole("button", { name: "Back to conditions" }).click();
      await expect(
        page.getByRole("combobox", { name: "Condition 2 Field" }),
      ).toContainText(tempTitle);
      await expect(
        page.getByRole("spinbutton", { name: "Condition 2 Value" }),
      ).toHaveValue("38");
    });
  });
});
