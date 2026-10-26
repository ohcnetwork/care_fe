import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({
  storageState: "tests/.auth/user.json",
  viewport: { width: 1440, height: 1000 },
});

async function api<T>(
  request: APIRequestContext,
  path: string,
  data?: unknown,
  headers = adminApiHeaders(),
): Promise<T> {
  const response = await request.fetch(`${apiBaseUrl()}${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers,
    data,
  });
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json() as Promise<T>;
}

async function selectAuthorRole(page: Page, name: string) {
  await page
    .getByRole("combobox", { name: "Author role", exact: true })
    .click();
  await page
    .getByPlaceholder("Search organization", { exact: true })
    .fill(name);
  await page.getByRole("option", { name, exact: true }).click();
}

test("author roles filter real responses across forms, pages, history, and configured widgets", async ({
  page,
  request,
}) => {
  const facilityId = getFacilityId();
  const { patientId, encounterId } =
    await createQuestionnaireEncounter(facilityId);
  const stamp = faker.string.alphanumeric(8);
  const roles = await api<{ results: { id: string; name: string }[] }>(
    request,
    "/api/v1/role/?limit=100",
  );
  const securityRole = roles.results.find((role) => role.name === "Nurse");
  expect(securityRole, "Seeded Nurse role is required").toBeTruthy();
  const admin = await api<{ id: string }>(
    request,
    "/api/v1/users/getcurrentuser/",
  );
  const nurse = await api<{ id: string }>(request, "/api/v1/users/care-nurse/");
  const login = await api<{ access: string }>(request, "/api/v1/auth/login/", {
    username: "care-nurse",
    password: "Ohcn@123",
  });
  const nurseHeaders = {
    ...adminApiHeaders(),
    Authorization: `Bearer ${login.access}`,
  };
  const roleOrganizations = [];
  for (const [index, author] of [admin, nurse].entries()) {
    const organization = await api<{ id: string; name: string }>(
      request,
      "/api/v1/organization/",
      {
        name: `Response authors ${index} ${stamp}`,
        org_type: "role",
        active: true,
        description: "Response filter fixture",
      },
    );
    await api(request, `/api/v1/organization/${organization.id}/users/`, {
      user: author.id,
      role: securityRole!.id,
    });
    roleOrganizations.push(organization);
  }
  const [adminRole, nurseRole] = roleOrganizations;
  const questionId = faker.string.uuid();
  const makeQuestionnaire = (slug: string, title: string) =>
    api<{ id: string; slug: string; title: string }>(
      request,
      "/api/v1/questionnaire/",
      {
        auth_context: "instance",
        subject_type: "encounter",
        status: "active",
        version: "1.0",
        slug,
        title,
        description: "Role filter fixture",
        actions: [],
        styling_metadata: {},
        questions: [
          {
            id: questionId,
            link_id: "note",
            text: "Clinical note",
            type: "string",
          },
        ],
      },
    );
  const form = await makeQuestionnaire(`role-${stamp}`, `Role review ${stamp}`);
  const otherForm = await makeQuestionnaire(
    `other-${stamp}`,
    `Other review ${stamp}`,
  );
  const submit = (
    questionnaireId: string,
    value: string,
    headers = adminApiHeaders(),
  ) =>
    api<{ id: string }>(
      request,
      `/api/v1/questionnaire/${questionnaireId}/submit/`,
      {
        patient: patientId,
        encounter: encounterId,
        resource_id: encounterId,
        results: [{ question_id: questionId, values: [{ value }] }],
      },
      headers,
    );
  const adminNotes = Array.from(
    { length: 11 },
    (_, index) => `Physician note ${index} ${stamp}`,
  );
  for (const note of adminNotes) await submit(form.id, note);
  const nurseNote = `Nursing note ${stamp}`;
  const nurseResponse = await submit(form.id, nurseNote, nurseHeaders);
  const otherNote = `Other form note ${stamp}`;
  await submit(otherForm.id, otherNote);
  const basePath = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}`;
  const formParams = new URLSearchParams({
    questionnaireSlug: form.slug,
    questionnaireTitle: form.title,
  });

  await test.step("Role selection intersects the form filter and resets the selected response", async () => {
    await page.goto(
      `${basePath}/responses?${formParams}&responseId=${nurseResponse.id}#response-${nurseResponse.id}`,
    );
    await expect(page.getByText(nurseNote, { exact: true })).toBeVisible();
    await selectAuthorRole(page, adminRole.name);
    await expect(page).toHaveURL(new RegExp(`role=${adminRole.id}`));
    await expect
      .poll(() => new URL(page.url()).searchParams.get("responseId"))
      .toBeNull();
    expect(new URL(page.url()).hash).toBe("");
    expect(new URL(page.url()).searchParams.get("questionnaireSlug")).toBe(
      form.slug,
    );
    await expect(page.getByText(adminNotes[10], { exact: true })).toBeVisible();
    await expect(page.getByText(nurseNote, { exact: true })).toHaveCount(0);
    await expect(page.getByText(otherNote, { exact: true })).toHaveCount(0);
    await page
      .getByText(adminNotes[1], { exact: true })
      .scrollIntoViewIfNeeded();
    await expect(page.getByText(adminNotes[0], { exact: true })).toBeVisible();
  });

  await test.step("Changing and clearing the role replace cached pages without losing the form", async () => {
    await selectAuthorRole(page, nurseRole.name);
    await expect(page.getByText(nurseNote, { exact: true })).toBeVisible();
    await expect(page.getByText(adminNotes[0], { exact: true })).toHaveCount(0);
    await expect(page.getByText(adminNotes[10], { exact: true })).toHaveCount(
      0,
    );
    await page.reload();
    await expect(
      page.getByRole("combobox", { name: "Author role", exact: true }),
    ).toHaveText(nurseRole.name);
    await expect(page.getByText(nurseNote, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Clear author role filter", exact: true })
      .click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("role"))
      .toBeNull();
    await expect(page.getByText(adminNotes[10], { exact: true })).toBeVisible();
    await expect(page.getByText(nurseNote, { exact: true })).toBeVisible();
    await expect(page.getByText(otherNote, { exact: true })).toHaveCount(0);
  });

  await test.step("Patient history uses the same persisted role filter", async () => {
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/history/responses?${formParams}&role=${nurseRole.id}`,
    );
    await expect(
      page.getByRole("combobox", { name: "Author role", exact: true }),
    ).toHaveText(nurseRole.name);
    await expect(page.getByText(nurseNote, { exact: true })).toBeVisible();
    await expect(page.getByText(adminNotes[10], { exact: true })).toHaveCount(
      0,
    );
  });

  await test.step("Two configured widgets independently filter the real response API", async () => {
    // Supply a workspace layout without changing the user's saved default.
    // Clinical responses and role membership are served by the real backend.
    const workspace = {
      id: faker.string.uuid(),
      name: `Role widgets ${stamp}`,
      status: "active",
      description: "Role-filtered notes",
      created_by: null,
      updated_by: null,
      template: {
        schema_version: 1,
        pages: [
          {
            key: "role-notes",
            kind: "custom",
            title: "Role notes",
            columns: [
              {
                span: 1,
                widgets: roleOrganizations.map((role) => ({
                  type: "questionnaire_responses",
                  title: role.name,
                  config: {
                    role: role.id,
                    questionnaire_slug: form.slug,
                    limit: 1,
                  },
                })),
              },
            ],
          },
        ],
      },
    };
    await page.route("**/api/v1/workspace/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/v1/workspace/get_user_default_attributes/") {
        await route.fulfill({
          json: {
            count: 1,
            results: [
              { attribute: "encounter_class", value: "amb", workspace },
            ],
          },
        });
      } else if (url.pathname === "/api/v1/workspace/") {
        await route.fulfill({ json: { count: 1, results: [workspace] } });
      } else await route.continue();
    });
    await page.goto(`${basePath}/role-notes`);
    const physicianWidget = page.getByRole("region", {
      name: adminRole.name,
      exact: true,
    });
    const nursingWidget = page.getByRole("region", {
      name: nurseRole.name,
      exact: true,
    });
    await expect(
      physicianWidget.getByText(adminNotes[10], { exact: true }),
    ).toBeVisible();
    await expect(
      physicianWidget.getByText(nurseNote, { exact: true }),
    ).toHaveCount(0);
    await expect(
      nursingWidget.getByText(nurseNote, { exact: true }),
    ).toBeVisible();
    await expect(
      nursingWidget.getByText(adminNotes[10], { exact: true }),
    ).toHaveCount(0);
  });
});
