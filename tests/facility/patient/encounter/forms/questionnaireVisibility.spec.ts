import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

type SubjectType = "encounter" | "patient";
type Status = "active" | "draft" | "retired";

async function createQuestionnaire(subjectType: SubjectType, status: Status) {
  const slug = faker.string.alphanumeric({ length: 10 });
  const title = `Visibility ${subjectType} ${status} ${slug}`;
  const response = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      title,
      slug,
      description: "",
      version: "1.0",
      status,
      subject_type: subjectType,
      auth_context: "instance",
      organizations: [],
      actions: [],
      questions: [
        {
          id: crypto.randomUUID(),
          link_id: "note",
          text: "Note",
          type: "string",
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create questionnaire: ${response.status} — ${await response.text()}`,
    );
  }
  return title;
}

async function openEncounterForms(page: Page) {
  await page.goto(
    `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/updates`,
  );
  await page.getByRole("button", { name: "Forms" }).click();
}

async function openPatientForms(page: Page) {
  await page.goto(
    `/facility/${getFacilityId()}/patient/${getPatientId()}/questionnaire`,
  );
  await page.getByRole("combobox", { name: /add forms/i }).click();
}

async function expectFormListed(page: Page, title: string, listed: boolean) {
  const input = page.locator("[cmdk-input]");
  await input.waitFor({ state: "visible" });
  await input.fill(title);
  if (listed) {
    await expect(page.getByRole("option", { name: title })).toBeVisible();
  } else {
    await expect(page.getByText(/no results/i)).toBeVisible();
  }
}

const cases: [SubjectType, Status, boolean][] = [
  ["encounter", "active", true],
  ["encounter", "draft", false],
  ["encounter", "retired", false],
  ["patient", "active", true],
  ["patient", "draft", false],
  ["patient", "retired", false],
];

test.describe("Questionnaire visibility by status and subject type", () => {
  for (const [subjectType, status, listed] of cases) {
    test(`${status} ${subjectType} questionnaire is ${listed ? "" : "not "}offered in ${subjectType} forms and never in the other surface`, async ({
      page,
    }) => {
      const title = await createQuestionnaire(subjectType, status);

      await openEncounterForms(page);
      await expectFormListed(
        page,
        title,
        listed && subjectType === "encounter",
      );

      await openPatientForms(page);
      await expectFormListed(page, title, listed && subjectType === "patient");
    });
  }
});
