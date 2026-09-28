import { expect, test, type Page } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function createForm(questions: object[]) {
  const stamp = Date.now();
  const suffix = crypto.randomUUID().slice(0, 8);
  const res = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      title: `Input regression ${stamp}`,
      slug: `inputs-${suffix}`,
      version: "1.0",
      status: "active",
      subject_type: "encounter",
      auth_context: "instance",
      organizations: [],
      questions,
    }),
  });
  if (!res.ok) {
    throw new Error(`questionnaire create: ${res.status} ${await res.text()}`);
  }
  const { id } = (await res.json()) as { id: string };
  return id;
}

function fillUrl(questionnaireId: string) {
  return `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
}

interface DraftValue {
  value?: string | number;
  coding?: { code: string; system: string; display: string };
}

async function draftValues(page: Page, questionnaireId: string) {
  return page.evaluate((id): Record<string, DraftValue[]> | undefined => {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith("care_qn_fill_draft--")) continue;
      const draft = JSON.parse(localStorage.getItem(key)!);
      const form = draft.forms?.find(
        (entry: { questionnaireId: string }) => entry.questionnaireId === id,
      );
      if (!form) continue;
      return Object.fromEntries(
        Object.values(
          form.responses as Record<
            string,
            { link_id: string; values: DraftValue[] }
          >,
        ).map((response) => [response.link_id, response.values]),
      );
    }
    return undefined;
  }, questionnaireId);
}

test("fixed choice chips and dropdowns retain the selected option coding", async ({
  page,
}) => {
  const variants = [
    { id: "single_chips", count: 2, repeats: false },
    { id: "multiple_chips", count: 2, repeats: true },
    { id: "single_dropdown", count: 6, repeats: false },
    { id: "multiple_dropdown", count: 6, repeats: true },
  ];
  const coding = {
    code: "1",
    system: "https://example.com/choice",
    display: "Option 1",
  };
  const questions = variants.map(({ id, count, repeats }) => ({
    id: crypto.randomUUID(),
    link_id: id,
    text: id,
    type: "choice",
    repeats,
    answer_option: Array.from({ length: count }, (_, index) => ({
      value: `Option ${index + 1}`,
      code: {
        ...coding,
        code: String(index + 1),
        display: `Option ${index + 1}`,
      },
    })),
  }));
  const questionnaireId = await createForm(questions);
  // The current backend's fixed-option schema strips optional `code`.
  // Supply the frontend-supported coded option shape on the detail read so
  // this regression exercises retention by all four controls and drafts.
  await page.route(
    `**/api/v1/questionnaire/${questionnaireId}/`,
    async (route) => {
      const response = await route.fetch();
      const definition = await response.json();
      await route.fulfill({ response, json: { ...definition, questions } });
    },
  );
  await page.goto(fillUrl(questionnaireId));
  await questionBlock(page, "single_chips")
    .getByRole("radio", { name: "Option 1", exact: true })
    .click();
  await questionBlock(page, "multiple_chips")
    .getByRole("checkbox", { name: "Option 1", exact: true })
    .click();
  await questionBlock(page, "single_dropdown").getByRole("combobox").click();
  await page.getByRole("option", { name: "Option 1", exact: true }).click();
  await questionBlock(page, "multiple_dropdown").getByRole("combobox").click();
  await page
    .getByRole("option", { name: "Select Option 1", exact: true })
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();

  await expect
    .poll(async () => {
      const values = await draftValues(page, questionnaireId);
      return variants.map(({ id }) => values?.[id]?.[0]?.coding);
    })
    .toEqual(variants.map(() => coding));

  // A reload round-trips the same coded entries, rather than rebuilding
  // them from display strings when the controls mount again.
  await page.reload();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(
    questionBlock(page, "single_chips").getByRole("radio", {
      name: "Option 1",
      exact: true,
    }),
  ).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(async () => {
      const values = await draftValues(page, questionnaireId);
      return variants.map(({ id }) => values?.[id]?.[0]?.coding);
    })
    .toEqual(variants.map(() => coding));
});

test("decimal answers remain browser-valid and optional dates can be cleared", async ({
  page,
}) => {
  const questionnaireId = await createForm([
    {
      id: crypto.randomUUID(),
      link_id: "decimal",
      text: "Decimal answer",
      type: "decimal",
    },
    {
      id: crypto.randomUUID(),
      link_id: "date",
      text: "Optional date",
      type: "date",
    },
  ]);
  await page.goto(fillUrl(questionnaireId));
  const decimal = questionBlock(page, "Decimal answer").getByRole("spinbutton");
  await decimal.fill("1.5");
  expect(
    await decimal.evaluate((input: HTMLInputElement) => input.checkValidity()),
  ).toBe(true);

  const dateBlock = questionBlock(page, "Optional date");
  await dateBlock
    .getByRole("button", { name: "Pick a date", exact: true })
    .click();
  const day = page.getByRole("gridcell").getByRole("button", { name: /15/ });
  await day.click();
  await expect(
    dateBlock.getByRole("button", { name: "Pick a date", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(async () => (await draftValues(page, questionnaireId))?.date?.length)
    .toBe(1);
  await day.click();
  await expect(
    dateBlock.getByRole("button", { name: "Pick a date", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect
    .poll(async () => (await draftValues(page, questionnaireId))?.date)
    .toEqual([]);
  await page.reload();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(decimal).toHaveValue("1.5");
  await expect(
    dateBlock.getByRole("button", { name: "Pick a date", exact: true }),
  ).toBeVisible();
});

test("required composite inputs expose their label and requirement accessibly", async ({
  page,
}) => {
  const variants = [
    { type: "date", text: "Required date" },
    { type: "dateTime", text: "Required appointment" },
    {
      type: "choice",
      text: "Required choices",
      repeats: true,
      answer_option: [{ value: "First" }, { value: "Second" }],
    },
  ];
  const questionnaireId = await createForm(
    variants.map((question) => ({
      ...question,
      id: crypto.randomUUID(),
      link_id: question.type,
      required: true,
    })),
  );
  await page.goto(fillUrl(questionnaireId));
  for (const { text } of variants) {
    const group = questionBlock(page, text).getByRole("group", {
      name: text,
      exact: true,
    });
    await expect(group).toHaveAccessibleDescription("Required");
    await expect(group).not.toHaveAttribute("aria-required");
  }
});
