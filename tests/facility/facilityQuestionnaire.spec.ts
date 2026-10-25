import { faker } from "@faker-js/faker";
import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const FACILITY_QUESTIONNAIRE_SLUG = "e2e-subject-facility";
const FACILITY_QUESTIONNAIRE_TITLE = "E2E Facility Questionnaire";

interface FacilityForm {
  id: string;
  title: string;
  questionId: string;
}

async function dismissUpdateNotice(notice: Locator) {
  await notice
    .getByRole("button", { name: "Close toast", exact: true })
    .click();
}

async function fixtureRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: adminApiHeaders(),
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  expect(
    response.ok,
    `${options.method ?? "GET"} ${path}: ${response.status}`,
  ).toBe(true);
  return response.json() as Promise<T>;
}

/** Unique forms let tests filter their own submissions without changing existing history. */
async function createFacilityForm(facilityId: string): Promise<FacilityForm> {
  const suffix = faker.string.alphanumeric(10).toLowerCase();
  const title = `Facility inspection ${suffix}`;
  const questionId = faker.string.uuid();
  const form = await fixtureRequest<{ id: string }>("/api/v1/questionnaire/", {
    method: "POST",
    body: {
      title,
      slug: `facility-inspection-${suffix}`,
      status: "active",
      subject_type: "facility",
      auth_context: "facility",
      facility: facilityId,
      questions: [
        { id: questionId, link_id: "notes", text: "Notes", type: "string" },
      ],
    },
  });
  return { id: form.id, title, questionId };
}

async function submitFacilityResponse(
  facilityId: string,
  form: FacilityForm,
  answer: string,
) {
  const response = await fixtureRequest<{ id: string }>(
    `/api/v1/questionnaire/${form.id}/submit_resource/`,
    {
      method: "POST",
      body: {
        resource_id: facilityId,
        results: [
          { question_id: form.questionId, values: [{ value: answer }] },
        ],
      },
    },
  );
  return { id: response.id, answer };
}

test.describe("Facility forms and responses", () => {
  let facilityId: string;
  let facilityName: string;
  let facilityPath: string;
  let questionnaireId: string;
  let updateNotice: Locator;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    facilityPath = `/facility/${facilityId}/settings`;
    questionnaireId = await getQuestionnaireIdBySlug(
      FACILITY_QUESTIONNAIRE_SLUG,
    );
    const facility = await fixtureRequest<{ name: string }>(
      `/api/v1/facility/${facilityId}/`,
    );
    facilityName = facility.name;
    updateNotice = page
      .locator("li[data-sonner-toast]")
      .filter({ hasText: "Software Update" });
    await page.addLocatorHandler(updateNotice, dismissUpdateNotice);
  });

  test("General submits a facility-only form and opens its saved response", async ({
    page,
  }) => {
    const form = await createFacilityForm(facilityId);
    const answer = `Facility check ${faker.string.alphanumeric(10)}`;

    await test.step("General opens a facility-only picker without changing the URL", async () => {
      await page.goto(`${facilityPath}/general`);
      const forms = page.locator('[data-cy="facility-forms"]');
      const submit = forms.getByRole("button", { name: /^Submit forms/ });
      await submit.click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await expect(picker.getByPlaceholder("Search Forms")).toBeVisible();
      await expect(page).toHaveURL(`${facilityPath}/general`);
      await page.keyboard.press("Escape");
      await expect(picker).not.toBeVisible();
      await expect(submit).toBeFocused();
      await submit.click();
      const search = picker.getByPlaceholder("Search Forms");
      const pickerRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/questionnaire/" &&
          url.searchParams.get("title") === FACILITY_QUESTIONNAIRE_TITLE
        );
      });
      await search.fill(FACILITY_QUESTIONNAIRE_TITLE);
      await expect(
        picker.getByRole("option", {
          name: FACILITY_QUESTIONNAIRE_TITLE,
          exact: true,
        }),
      ).toBeVisible();
      const query = new URL((await pickerRequest).url()).searchParams;
      expect(query.get("subject_type")).toBe("facility");
      expect(query.get("facility_or_instance")).toBe(facilityId);
      expect(query.get("status")).toBe("active");
      for (const title of [
        "E2E Location Questionnaire",
        "E2E Device Questionnaire",
      ]) {
        await search.fill(title);
        await expect(
          picker.getByText("No Results Found", { exact: true }),
        ).toBeVisible();
        await expect(picker.getByRole("option")).toHaveCount(0);
      }
      await search.fill(form.title);
      await picker
        .getByRole("option", { name: form.title, exact: true })
        .click();
      await expect(page).toHaveURL(`${facilityPath}/questionnaire/${form.id}`);
    });

    await test.step("the fullscreen fill submits to the facility resource", async () => {
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      await expect(
        page.getByRole("tab", { name: "Patient Clinical History" }),
      ).toHaveCount(0);
      await expect(page.getByText("Blood Group:")).toHaveCount(0);
      await questionBlock(page, "Notes").getByRole("textbox").fill(answer);
      const batchRequest = page.waitForRequest(
        (request) =>
          request.url().includes("/api/v1/batch_requests/") &&
          request.method() === "POST",
      );
      const listRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/resource_responses/" &&
          url.searchParams.get("subject_id") === facilityId
        );
      });
      await page.getByRole("button", { name: "Save Changes" }).click();
      const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
        requests: { url: string; body: { resource_id: string } }[];
      };
      expect(body.requests).toHaveLength(1);
      expect(body.requests[0].url).toContain(
        `/api/v1/questionnaire/${form.id}/submit_resource/`,
      );
      expect(body.requests[0].body.resource_id).toBe(facilityId);
      expect(body.requests[0].body).not.toHaveProperty("patient");
      expect(body.requests[0].body).not.toHaveProperty("encounter");
      await expectToast(page, "Questionnaire submitted successfully");
      await expect(page).toHaveURL(`${facilityPath}/responses`);
      expect(
        new URL((await listRequest).url()).searchParams.get("subject_type"),
      ).toBe("facility");
    });

    await test.step("the response viewer shows the persisted answer after reload", async () => {
      const row = page
        .locator(
          '[data-cy="facility-responses-page"] [data-slot="table-body"] tr',
        )
        .filter({ hasText: form.title });
      await expect(row).toHaveCount(1);
      await row.getByRole("button", { name: "View", exact: true }).click();
      const viewer = page.getByRole("dialog", {
        name: form.title,
        exact: true,
      });
      await expect(viewer.getByText(answer, { exact: true })).toBeVisible();
      await expect(
        viewer.getByText(facilityName, { exact: true }),
      ).toBeVisible();
      expect(new URL(page.url()).searchParams.get("response")).toBe(
        await row.getAttribute("data-response-id"),
      );
      await page.reload();
      await expect(viewer.getByText(answer, { exact: true })).toBeVisible();
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(viewer).not.toBeVisible();
      await expect(page).toHaveURL(`${facilityPath}/responses`);
    });

    await test.step("bare and in-session pickers retain the facility scope", async () => {
      const addedForm = await createFacilityForm(facilityId);
      await page.goto(`${facilityPath}/questionnaire`);
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      await page
        .getByRole("combobox", {
          name: "Select a questionnaire to fill",
          exact: true,
        })
        .click();
      const bareRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/questionnaire/" &&
          url.searchParams.get("title") === "E2E Facility"
        );
      });
      await page.getByPlaceholder("Search Forms").fill("E2E Facility");
      await page
        .getByRole("option", {
          name: FACILITY_QUESTIONNAIRE_TITLE,
          exact: true,
        })
        .click();
      const bareQuery = new URL((await bareRequest).url()).searchParams;
      expect(bareQuery.get("subject_type")).toBe("facility");
      expect(bareQuery.get("facility_or_instance")).toBe(facilityId);
      await expect(page).toHaveURL(
        `${facilityPath}/questionnaire/${questionnaireId}`,
      );
      await expect(questionBlock(page, "Notes")).toBeVisible();
      await page
        .getByRole("button", { name: "Add Questionnaire", exact: true })
        .click();
      const addRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/questionnaire/" &&
          url.searchParams.get("title") === addedForm.title
        );
      });
      await page.getByPlaceholder("Search Forms").fill(addedForm.title);
      await page
        .getByRole("option", { name: addedForm.title, exact: true })
        .click();
      const addQuery = new URL((await addRequest).url()).searchParams;
      expect(addQuery.get("subject_type")).toBe("facility");
      expect(addQuery.get("facility_or_instance")).toBe(facilityId);
      const canvas = page.getByRole("region", {
        name: "Form canvas",
        exact: true,
      });
      await expect(canvas.locator("[data-form-key]")).toHaveCount(2);
      await expect(
        canvas.getByRole("heading", { name: addedForm.title, exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page).toHaveURL(`${facilityPath}/responses`);
    });
  });

  test("filters facility history and uses response links and forms on mobile", async ({
    page,
  }) => {
    const firstForm = await createFacilityForm(facilityId);
    const form = await createFacilityForm(facilityId);
    await submitFacilityResponse(
      facilityId,
      firstForm,
      `Routine check ${faker.string.alphanumeric(8)}`,
    );
    const completed = await submitFacilityResponse(
      facilityId,
      form,
      `Passed inspection ${faker.string.alphanumeric(8)}`,
    );
    const errored = await submitFacilityResponse(
      facilityId,
      form,
      `Incorrect inspection ${faker.string.alphanumeric(8)}`,
    );
    await fixtureRequest(`/api/v1/resource_responses/${errored.id}/`, {
      method: "PUT",
      body: { status: "entered_in_error" },
    });
    const user = await fixtureRequest<{ id: string; username: string }>(
      "/api/v1/users/getcurrentuser/",
    );
    const rows = page.locator(
      '[data-cy="facility-responses-page"] [data-slot="table-body"] tr',
    );
    const filters = page.locator('[data-cy="facility-response-filters"]');
    await page.goto(`${facilityPath}/responses`);

    await test.step("form, status and submitter filters persist with the correct responses", async () => {
      await expect(rows.filter({ hasText: firstForm.title })).toHaveCount(1);
      await expect(rows.filter({ hasText: form.title })).toHaveCount(2);
      await filters
        .getByRole("combobox", { name: "Questionnaire", exact: true })
        .click();
      const formRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/questionnaire/" &&
          url.searchParams.get("title") === form.title
        );
      });
      await page
        .getByRole("combobox", { name: "Search Forms", exact: true })
        .fill(form.title);
      await page.getByRole("option", { name: form.title, exact: true }).click();
      const formQuery = new URL((await formRequest).url()).searchParams;
      expect(formQuery.get("subject_type")).toBe("facility");
      expect(formQuery.get("facility_or_instance")).toBe(facilityId);
      await expect(rows).toHaveCount(2);
      await expect(rows.filter({ hasText: firstForm.title })).toHaveCount(0);
      await filters
        .getByRole("combobox", { name: "Status", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Entered in Error", exact: true })
        .click();
      await expect(rows).toHaveCount(1);
      await expect(rows).toHaveAttribute("data-response-id", errored.id);
      await filters
        .getByRole("combobox", { name: "Status", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Completed", exact: true })
        .click();
      await expect(rows).toHaveAttribute("data-response-id", completed.id);
      const submitter = filters.getByRole("combobox", {
        name: "Submitted by",
        exact: true,
      });
      await submitter.click();
      await page
        .getByPlaceholder("Search", { exact: true })
        .fill(user.username);
      const authorRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/resource_responses/" &&
          url.searchParams.get("created_by") === user.id
        );
      });
      await page
        .getByRole("option")
        .filter({ has: page.getByText(user.username, { exact: true }) })
        .click();
      const query = new URL((await authorRequest).url()).searchParams;
      expect(query.get("subject_type")).toBe("facility");
      expect(query.get("subject_id")).toBe(facilityId);
      const submitterName = await submitter.innerText();
      await page.reload();
      await expect(rows).toHaveAttribute("data-response-id", completed.id);
      await expect(
        filters.getByRole("combobox", { name: "Questionnaire", exact: true }),
      ).toContainText(form.title);
      await expect(
        filters.getByRole("combobox", { name: "Status", exact: true }),
      ).toContainText("Completed");
      await expect(submitter).toContainText(submitterName);
      const params = new URL(page.url()).searchParams;
      expect(params.get("questionnaire")).toBe(form.id);
      expect(params.get("created_by")).toBe(user.id);
      expect(params.get("status")).toBe("completed");
    });

    await test.step("a direct response link and picker work on mobile without losing filters", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      const filteredUrl = page.url();
      // A directly opened mobile modal covers background notifications.
      // Dismiss any update notice after closing it, when its control is reachable.
      await page.removeLocatorHandler(updateNotice);
      await page.goto(`${filteredUrl}&response=${completed.id}`);
      const viewer = page.getByRole("dialog", {
        name: form.title,
        exact: true,
      });
      await expect(
        viewer.getByText(completed.answer, { exact: true }),
      ).toBeVisible();
      await expect(
        viewer.getByText(facilityName, { exact: true }),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(390);
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(viewer).not.toBeVisible();
      expect(page.url()).toBe(filteredUrl);
      await page.addLocatorHandler(updateNotice, dismissUpdateNotice);
      await page
        .getByRole("button", { name: "Submit forms", exact: true })
        .click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await picker
        .getByPlaceholder("Search Forms")
        .fill(FACILITY_QUESTIONNAIRE_TITLE);
      await expect(
        picker.getByRole("option", {
          name: FACILITY_QUESTIONNAIRE_TITLE,
          exact: true,
        }),
      ).toBeVisible();
      expect(page.url()).toBe(filteredUrl);
      await page.keyboard.press("Escape");
      await expect(picker).not.toBeVisible();
      expect(page.url()).toBe(filteredUrl);
      await expect(rows).toHaveAttribute("data-response-id", completed.id);
    });

    await test.step("General's mobile form action opens a fullscreen fill and Close returns to Responses", async () => {
      await page.goto(`${facilityPath}/general`);
      const forms = page.locator('[data-cy="facility-forms"]');
      await expect(
        forms.getByRole("link", { name: /^Responses/ }),
      ).toHaveAttribute("href", `${facilityPath}/responses`);
      await forms.getByRole("button", { name: /^Submit forms/ }).click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await picker
        .getByPlaceholder("Search Forms")
        .fill(FACILITY_QUESTIONNAIRE_TITLE);
      await picker
        .getByRole("option", {
          name: FACILITY_QUESTIONNAIRE_TITLE,
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(
        `${facilityPath}/questionnaire/${questionnaireId}`,
      );
      await expect(questionBlock(page, "Notes")).toBeVisible();
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page).toHaveURL(`${facilityPath}/responses`);
      await expect(
        page.getByRole("heading", { name: "Responses", exact: true }),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(390);
    });
  });
});
