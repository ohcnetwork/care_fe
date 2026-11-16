import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { questionBlock } from "tests/helper/questionnaireV2";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("a hidden controller cannot keep an OR follow-up active or block a real submission", async ({
  page,
  request,
}) => {
  const ids = Array.from({ length: 3 }, () => faker.string.uuid());
  const created = await request.post(`${getApiUrl()}/api/v1/questionnaire/`, {
    headers: getApiHeaders(),
    data: {
      title: `Hidden controller ${faker.string.alphanumeric(8)}`,
      slug: `hidden-controller-${faker.string.alphanumeric(8).toLowerCase()}`,
      description: "Conditional answer submission regression",
      status: "active",
      auth_context: "instance",
      subject_type: "encounter",
      questions: [
        {
          id: ids[0],
          link_id: "show",
          text: "Show extra details",
          type: "boolean",
        },
        {
          id: ids[1],
          link_id: "details",
          text: "Extra details",
          type: "string",
          enable_when: [
            { question: "show", operator: "equals", answer: "Yes" },
          ],
        },
        {
          id: ids[2],
          link_id: "followup",
          text: "Follow-up details",
          type: "string",
          enable_behavior: "any",
          enable_when: [
            { question: "details", operator: "equals", answer: "keep" },
            { question: "show", operator: "equals", answer: "Yes" },
          ],
        },
      ],
    },
  });
  expect(created.ok(), await created.text()).toBe(true);
  const questionnaire = (await created.json()) as { id: string };
  const facilityId = getFacilityId();
  const { patientId, encounterId } =
    await createQuestionnaireEncounter(facilityId);
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${questionnaire.id}`,
  );
  const controller = questionBlock(page, "Show extra details");
  await controller.getByRole("radio", { name: "Yes", exact: true }).click();
  await questionBlock(page, "Extra details").getByRole("textbox").fill("keep");
  await questionBlock(page, "Follow-up details")
    .getByRole("textbox")
    .fill("Must not be submitted while hidden");
  await controller.getByRole("radio", { name: "No", exact: true }).click();
  await expect(questionBlock(page, "Extra details")).toHaveCount(0);
  await expect(questionBlock(page, "Follow-up details")).toHaveCount(0);
  const submit = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/batch_requests/") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  const response = await submit;
  expect(response.ok(), await response.text()).toBe(true);
  const body = response.request().postDataJSON() as {
    requests: { body: { results?: { question_id: string }[] } }[];
  };
  const submittedIds = body.requests
    .flatMap((item) => item.body.results ?? [])
    .map((item) => item.question_id);
  expect(submittedIds).toContain(ids[0]);
  expect(submittedIds).not.toContain(ids[1]);
  expect(submittedIds).not.toContain(ids[2]);
});
