import { expect, test } from "@playwright/test";
import {
  fillStringField,
  submitAndExpectSuccess,
  submitForm,
} from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/** The first instruction the backend registers (the `logging` smoke test
 *  today) — its first string input is what the message lands in. */
async function firstInstruction() {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/action_configuration/instructions/`,
    { headers: adminApiHeaders() },
  );
  const data = (await res.json()) as {
    instructions: {
      slug: string;
      input_schema: { properties?: Record<string, unknown> };
    }[];
  };
  const instruction =
    data.instructions.find((entry) => entry.slug === "show_message") ??
    data.instructions[0];
  if (!instruction) throw new Error("No action instructions registered");
  return {
    slug: instruction.slug,
    paramName: Object.keys(instruction.input_schema.properties ?? {})[0],
  };
}

/** Authors an encounter questionnaire with actions straight through the
 *  API — this file is about what happens at fill time. */
async function createQuestionnaireWithActions(
  stamp: number,
  questions: object[],
  actions: object[],
): Promise<string> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      title: `QV2 Fill Actions ${stamp}`,
      slug: `qv2-fill-actions-${stamp}`,
      version: "1.0",
      status: "active",
      subject_type: "encounter",
      auth_context: "instance",
      questions,
      actions,
    }),
  });
  if (!res.ok) {
    throw new Error(`questionnaire create: ${res.status} ${await res.text()}`);
  }
  return ((await res.json()) as { id: string }).id;
}

test.describe("Questionnaire v2 fill — actions", () => {
  test("an always-on action's message is shown after a successful submission", async ({
    page,
  }) => {
    const { slug, paramName } = await firstInstruction();
    const stamp = Date.now();
    const noteTitle = `Note ${stamp}`;
    const questionnaireId = await createQuestionnaireWithActions(
      stamp,
      [
        {
          id: crypto.randomUUID(),
          link_id: "note",
          text: noteTitle,
          type: "string",
        },
      ],
      [
        {
          condition: "True",
          instructions: [
            {
              slug,
              params: { [paramName]: `{{ f"Action ping {q_note}" }}` },
              context: "self",
            },
          ],
        },
      ],
    );

    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );
    await expect(questionBlock(page, noteTitle)).toBeVisible();
    await fillStringField(page, noteTitle, `hello-${stamp}`);
    await submitAndExpectSuccess(page);
    await expectToast(page, `Action ping hello-${stamp}`);
  });

  test("a referenced question left blank is flagged on the form instead of failing the submission", async ({
    page,
  }) => {
    const { slug, paramName } = await firstInstruction();
    const stamp = Date.now();
    const tempTitle = `Temperature ${stamp}`;
    const questionnaireId = await createQuestionnaireWithActions(
      stamp,
      [
        {
          id: crypto.randomUUID(),
          link_id: "temp",
          text: tempTitle,
          type: "decimal",
        },
        {
          id: crypto.randomUUID(),
          link_id: "note",
          text: `Note ${stamp}`,
          type: "string",
        },
      ],
      [
        {
          condition: "q_temp > 38",
          instructions: [
            {
              slug,
              params: { [paramName]: `High temp ${stamp}` },
              context: "self",
            },
          ],
        },
      ],
    );

    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );
    await fillStringField(page, `Note ${stamp}`, "only the note");

    await test.step("Submit is blocked on the unanswered referenced question", async () => {
      await submitForm(page);
      await expect(
        questionBlock(page, tempTitle).getByText(
          "This answer is needed by the form's actions",
        ),
      ).toBeVisible();
    });

    await test.step("Answering it lets the submission through and the action fires", async () => {
      await questionBlock(page, tempTitle).getByRole("spinbutton").fill("39");
      await submitAndExpectSuccess(page);
      await expectToast(page, `High temp ${stamp}`);
    });
  });
});
