import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import {
  addTopLevelQuestion,
  createQuestionnaireAndOpenBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

import type { Question } from "@/types/questionnaire/question";

test.use({ storageState: "tests/.auth/user.json" });
test.skip(
  process.env.CARE_DENTAL_E2E !== "1",
  "Requires the care_dental_fe plugin",
);

test("registered dental groups save one tooth and finding per repeated row", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  const stamp = Date.now();
  let group: Question;
  let questionnaireId: string;

  await test.step("Create a registered group through the group picker", async () => {
    const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Dental ${stamp}`,
      status: "Active",
    });
    questionnaireId = detailUrl.split("/").at(-1)!;
    await addTopLevelQuestion(page, `Dental findings ${stamp}`);
    await page
      .getByRole("combobox", { name: "Question Type", exact: true })
      .click();
    await page
      .locator('[data-slot="command-item"][data-value="group"]')
      .click();
    await page
      .getByRole("option", { name: "Dental chart", exact: true })
      .click();
    await page
      .getByRole("checkbox", {
        name: "Require at least one tooth",
        exact: true,
      })
      .check();
    await expect(
      page.getByRole("button", { name: "Add Sub-Question" }),
    ).not.toBeVisible();
  });

  await test.step("Save and reload the two-child repeating schema", async () => {
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/questionnaire/") &&
        response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();
    const response = await saved;
    expect(response.ok()).toBeTruthy();
    group = ((await response.json()) as { questions: Question[] }).questions[0];
    expect(group).toMatchObject({
      type: "group",
      repeats: true,
      required: true,
      structured_type: "care_dental_fe.tooth_chart",
    });
    expect(group.questions).toHaveLength(2);
    expect(
      group.questions!.map(({ link_id, type, repeats }) => ({
        link_id,
        type,
        repeats: !!repeats,
      })),
    ).toEqual([
      { link_id: `${group.link_id}__tooth`, type: "choice", repeats: false },
      { link_id: `${group.link_id}__type`, type: "choice", repeats: false },
    ]);
    await expectToast(page, "Questionnaire updated successfully");
    await page.reload();
    await expect(
      page.getByRole("checkbox", {
        name: "Require at least one tooth",
        exact: true,
      }),
    ).toBeChecked();
    await expect(
      page.getByRole("button", { name: "Repair schema", exact: true }),
    ).toHaveCount(0);
  });

  await test.step("The fill renderer preserves and removes independent rows", async () => {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    const canvas = page.getByRole("region", { name: "Form canvas" });
    const first = canvas.locator('button[data-tooth="11"]');
    const second = canvas.locator('button[data-tooth="21"]');
    await first.click();
    await second.click();
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await first.click();
    await expect(first).toHaveAttribute("aria-pressed", "false");
    await expect(second).toHaveAttribute("aria-pressed", "true");
  });

  await test.step("Submit two findings on one tooth and a plain selection as ordinary rows", async () => {
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${questionnaireId}`,
    );
    const chart = page.locator(".care-dental-fe");
    await chart.getByRole("radio", { name: "Caries", exact: true }).click();
    await chart.locator('button[data-tooth="11"]').click();
    await chart.getByRole("radio", { name: "Mobile", exact: true }).click();
    await chart.locator('button[data-tooth="11"]').click();
    await chart.getByRole("radio", { name: "Select", exact: true }).click();
    await chart.locator('button[data-tooth="21"]').click();

    const tooth = group.questions!.find(
      (child) => child.link_id === `${group.link_id}__tooth`,
    )!;
    const type = group.questions!.find(
      (child) => child.link_id === `${group.link_id}__type`,
    )!;
    const submittedBatch = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/batch_requests/") &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    const response = await submittedBatch;
    expect(response.ok()).toBeTruthy();
    const payload = response.request().postDataJSON() as {
      requests: {
        url: string;
        reference_id: string;
        body: {
          results: {
            question_id: string;
            sub_results: {
              question_id: string;
              values: { value: string }[];
            }[][];
          }[];
        };
      }[];
    };
    expect(payload.requests).toHaveLength(1);
    const submission = payload.requests[0];
    expect(submission.url).toContain(
      `/questionnaire/${questionnaireId}/submit/`,
    );
    expect(submission.body.results).toHaveLength(1);
    const result = submission.body.results[0];
    expect(result.question_id).toBe(group.id);
    expect(result.sub_results).toHaveLength(3);
    const rowValues = result.sub_results.map((row) => ({
      tooth: row
        .find((answer) => answer.question_id === tooth.id)
        ?.values.map(({ value }) => value),
      type: row
        .find((answer) => answer.question_id === type.id)
        ?.values.map(({ value }) => value),
    }));
    expect(rowValues).toEqual(
      expect.arrayContaining([
        { tooth: ["11"], type: ["caries"] },
        { tooth: ["11"], type: ["mobile"] },
        { tooth: ["21"], type: undefined },
      ]),
    );
    const batch = (await response.json()) as {
      results: {
        reference_id: string;
        status_code: number;
        data: { cleaned_response: Record<string, unknown> };
      }[];
    };
    const submitted = batch.results.find(
      (entry) => entry.reference_id === submission.reference_id,
    )!;
    expect(submitted.status_code).toBe(200);
    expect(submitted.data.cleaned_response[group.link_id]).toEqual(
      expect.arrayContaining([
        { [tooth.link_id]: "11", [type.link_id]: "caries" },
        { [tooth.link_id]: "11", [type.link_id]: "mobile" },
        { [tooth.link_id]: "21" },
      ]),
    );
    await expectToast(page, /questionnaire submitted successfully/i);
  });
});

test("repair aligns a registered group's child schema while preserving matching IDs", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  await createQuestionnaireAndOpenBuilder(page, {
    basePath: `/facility/${facilityId}/settings/questionnaires`,
    title: `QV2 Dental Repair ${Date.now()}`,
  });
  await page.getByRole("button", { name: "Import Questions" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "outdated-group.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        questions: [
          {
            text: "Dental findings",
            type: "group",
            structured_type: "care_dental_fe.tooth_chart",
            link_id: "chart",
            repeats: false,
            required: true,
            questions: [
              {
                link_id: "chart__tooth",
                type: "string",
                text: "Old tooth field",
                max_length: 3,
              },
              {
                link_id: "chart__obsolete",
                type: "text",
                text: "Obsolete field",
              },
            ],
          },
        ],
      }),
    ),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expectToast(page, "Questionnaire Imported Successfully");
  const repair = page.getByRole("button", {
    name: "Repair schema",
    exact: true,
  });
  await expect(repair).toBeVisible();

  const save = async () => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/questionnaire/") &&
        response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: /^Save Changes/ }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    await expectToast(page, "Questionnaire updated successfully");
    return ((await response.json()) as { questions: Question[] }).questions[0];
  };
  const original = await save();
  await page.reload();
  await expect(repair).toBeVisible();
  await repair.click();
  await expect(repair).toHaveCount(0);
  const repaired = await save();
  expect(repaired).toMatchObject({
    id: original.id,
    link_id: original.link_id,
    text: original.text,
    required: true,
    repeats: true,
  });
  expect(repaired.questions).toHaveLength(2);
  expect(repaired.questions![0]).toMatchObject({
    id: original.questions![0].id,
    link_id: original.questions![0].link_id,
    text: "Tooth",
    type: "choice",
    required: true,
  });
  expect(repaired.questions![0].max_length ?? null).toBeNull();
  expect(repaired.questions![0].answer_option).toHaveLength(52);
  expect(repaired.questions![1]).toMatchObject({
    link_id: `${original.link_id}__type`,
    text: "Finding",
    type: "choice",
  });
  expect(repaired.questions!.map((question) => question.id)).not.toContain(
    original.questions![1].id,
  );
  await page.reload();
  await expect(
    page.getByRole("checkbox", {
      name: "Require at least one tooth",
      exact: true,
    }),
  ).toBeChecked();
  await expect(repair).toHaveCount(0);
});
