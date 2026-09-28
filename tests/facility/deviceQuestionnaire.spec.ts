import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
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

/** Backend E2E fixture: subject_type "device", one string question. */
const DEVICE_QUESTIONNAIRE_SLUG = "e2e-subject-device";
const DEVICE_QUESTIONNAIRE_TITLE = "E2E Device Questionnaire";
const LOCATION_QUESTIONNAIRE_TITLE = "E2E Location Questionnaire";

interface DeviceHistoryForm {
  id: string;
  title: string;
  questionId: string;
}

interface DeviceHistoryResponse {
  id: string;
  answer: string;
}

interface DeviceHistoryUser {
  id: string;
  username: string;
}

async function historyRequest<T>(
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

/** Small, varied history for reviewing a device; the other test submits via UI. */
async function createDeviceResponseHistory(
  facilityId: string,
  deviceId: string,
) {
  const suffix = faker.string.alphanumeric(10).toLowerCase();
  const createForm = async (label: string): Promise<DeviceHistoryForm> => {
    const questionId = faker.string.uuid();
    const title = `Device inspection ${label} ${suffix}`;
    const form = await historyRequest<{ id: string }>(
      "/api/v1/questionnaire/",
      {
        method: "POST",
        body: {
          title,
          slug: `device-inspection-${label.toLowerCase()}-${suffix}`,
          status: "active",
          subject_type: "device",
          auth_context: "facility",
          facility: facilityId,
          questions: [
            { id: questionId, link_id: "notes", text: "Notes", type: "string" },
          ],
        },
      },
    );
    return { id: form.id, title, questionId };
  };
  const submit = async (
    form: DeviceHistoryForm,
    answer: string,
  ): Promise<DeviceHistoryResponse> => {
    const response = await historyRequest<{ id: string }>(
      `/api/v1/questionnaire/${form.id}/submit_resource/`,
      {
        method: "POST",
        body: {
          resource_id: deviceId,
          results: [
            { question_id: form.questionId, values: [{ value: answer }] },
          ],
        },
      },
    );
    return { id: response.id, answer };
  };

  const firstForm = await createForm("A");
  const secondForm = await createForm("B");
  await submit(firstForm, `Routine check ${suffix}`);
  const completed = await submit(secondForm, `Passed inspection ${suffix}`);
  const errored = await submit(secondForm, `Incorrect inspection ${suffix}`);
  await historyRequest(`/api/v1/resource_responses/${errored.id}/`, {
    method: "PUT",
    body: { status: "entered_in_error" },
  });
  const user = await historyRequest<DeviceHistoryUser>(
    "/api/v1/users/getcurrentuser/",
  );
  return { firstForm, secondForm, completed, errored, user };
}

/**
 * Registers a device through the settings UI and opens its detail page.
 * Returns the device's id (read back off the URL) so the spec can assert
 * what the submission was recorded against.
 */
async function createAndOpenDevice(
  page: Page,
  facilityId: string,
): Promise<{ id: string; name: string }> {
  const name = `Fill-${faker.string.alphanumeric(8)}`;
  await page.goto(`/facility/${facilityId}/settings/devices`);
  await page.getByRole("link", { name: "Add Device" }).click();
  await page.getByRole("textbox", { name: "Registered Name *" }).fill(name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Device registered successfully")).toBeVisible();

  await page.goto(`/facility/${facilityId}/settings/devices`);
  await page.getByRole("textbox", { name: "Search devices..." }).fill(name);
  await page.getByRole("link", { name }).click();
  await page.waitForURL(/\/settings\/devices\/[0-9a-f-]+$/);
  return { id: page.url().split("/").pop() as string, name };
}

test.describe("Device forms and responses", () => {
  let facilityId: string;
  let questionnaireId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    // Resolve the fixture BEFORE driving any UI — a missing fixture fails
    // with the helper's "reload backend E2E fixtures" error.
    questionnaireId = await getQuestionnaireIdBySlug(DEVICE_QUESTIONNAIRE_SLUG);

    // A rebuilt preview can show this persistent notice over mobile controls.
    const updateNotice = page.locator("li[data-sonner-toast]").filter({
      hasText: "Software Update",
    });
    await page.addLocatorHandler(updateNotice, async (notice) => {
      await notice
        .getByRole("button", { name: "Close toast", exact: true })
        .click();
    });
  });

  test("submits a device form and reviews only that device's saved responses", async ({
    page,
  }) => {
    const answer = `Dev-${faker.string.alphanumeric(10)}`;
    const device = await createAndOpenDevice(page, facilityId);
    const devicePath = `/facility/${facilityId}/settings/devices/${device.id}`;
    const responsePage = page.locator('[data-cy="device-responses-page"]');
    const rows = responsePage.locator('[data-slot="table-body"] tr');
    let responseId = "";

    await test.step("the overview opens and dismisses its form picker without navigation", async () => {
      await expect(
        page.getByRole("heading", { name: device.name, level: 1, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Overview", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByRole("button", { name: "Fill questionnaire", exact: true }),
      ).toHaveCount(0);
      const submit = page.getByRole("button", {
        name: "Submit forms",
        exact: true,
      });
      await submit.click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await expect(picker.getByPlaceholder("Search Forms")).toBeVisible();
      await expect(page).toHaveURL(devicePath);
      await page.keyboard.press("Escape");
      await expect(picker).not.toBeVisible();
      await expect(submit).toBeFocused();
      await expect(page).toHaveURL(devicePath);
      await submit.click();
    });

    await test.step("the picker is scoped to device-subject questionnaires", async () => {
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      const search = picker.getByPlaceholder("Search Forms");
      const pickerRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/questionnaire/" &&
          url.searchParams.get("title") === DEVICE_QUESTIONNAIRE_TITLE
        );
      });
      await search.fill(DEVICE_QUESTIONNAIRE_TITLE);
      await expect(
        picker.getByRole("option", {
          name: DEVICE_QUESTIONNAIRE_TITLE,
          exact: true,
        }),
      ).toBeVisible();
      const query = new URL((await pickerRequest).url()).searchParams;
      expect(query.get("subject_type")).toBe("device");
      expect(query.get("status")).toBe("active");
      expect(query.get("facility_or_instance")).toBe(facilityId);

      await search.fill(LOCATION_QUESTIONNAIRE_TITLE);
      await expect(
        picker.getByText("No Results Found", { exact: true }),
      ).toBeVisible();
      await expect(picker.getByRole("option")).toHaveCount(0);
      await search.fill(DEVICE_QUESTIONNAIRE_TITLE);
      await picker
        .getByRole("option", { name: DEVICE_QUESTIONNAIRE_TITLE })
        .click();
      await expect(page).toHaveURL(
        `${devicePath}/questionnaire/${questionnaireId}`,
      );
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      await expect(
        page.getByRole("tab", { name: "Patient Clinical History" }),
      ).toHaveCount(0);
    });

    await test.step("answering and submitting posts to submit_resource", async () => {
      await questionBlock(page, "Notes").getByRole("textbox").fill(answer);

      const batchRequest = page.waitForRequest(
        (request) =>
          request.url().includes("/api/v1/batch_requests/") &&
          request.method() === "POST",
      );
      const responsesRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/resource_responses/" &&
          url.searchParams.get("subject_id") === device.id
        );
      });
      await page.getByRole("button", { name: "Save Changes" }).click();

      const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
        requests: { url: string; body: { resource_id: string } }[];
      };
      expect(body.requests).toHaveLength(1);
      expect(body.requests[0].url).toContain(
        `/api/v1/questionnaire/${questionnaireId}/submit_resource/`,
      );
      expect(body.requests[0].body.resource_id).toBe(device.id);
      expect(body.requests[0].body).not.toHaveProperty("patient");
      expect(body.requests[0].body).not.toHaveProperty("encounter");

      await expectToast(page, "Questionnaire submitted successfully");
      await expect(page).toHaveURL(`${devicePath}/responses`);
      const query = new URL((await responsesRequest).url()).searchParams;
      expect(query.get("subject_type")).toBe("device");
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText(DEVICE_QUESTIONNAIRE_TITLE);
      responseId = (await rows.getAttribute("data-response-id"))!;
      expect(responseId).toBeTruthy();
    });

    await test.step("the persisted response remains readable after reload and tab navigation", async () => {
      await expect(
        page.getByRole("tab", { name: "Responses", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await rows.getByRole("button", { name: "View", exact: true }).click();
      const viewer = page.getByRole("dialog", {
        name: DEVICE_QUESTIONNAIRE_TITLE,
        exact: true,
      });
      await expect(viewer.getByText(answer, { exact: true })).toBeVisible();
      await expect(
        viewer.getByText(device.name, { exact: true }),
      ).toBeVisible();
      expect(new URL(page.url()).searchParams.get("response")).toBe(responseId);
      await page.reload();
      await expect(viewer.getByText(answer, { exact: true })).toBeVisible();
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(viewer).not.toBeVisible();
      await page.getByRole("tab", { name: "Overview", exact: true }).click();
      await expect(page).toHaveURL(devicePath);
      await expect(
        page.locator('[data-cy="device-overview-panel"]'),
      ).toBeVisible();
      await page.getByRole("tab", { name: "Responses", exact: true }).click();
      await expect(page).toHaveURL(`${devicePath}/responses`);
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText(DEVICE_QUESTIONNAIRE_TITLE);
    });

    await test.step("another device cannot list or open this response", async () => {
      const otherDevice = await createAndOpenDevice(page, facilityId);
      const otherResponsesPath = `/facility/${facilityId}/settings/devices/${otherDevice.id}/responses`;
      await page.goto(otherResponsesPath);
      await expect(
        responsePage.getByText("No responses found", { exact: true }),
      ).toBeVisible();
      await expect(rows).toHaveCount(0);
      await page.goto(`${otherResponsesPath}?response=${responseId}`);
      const viewer = page.getByRole("dialog", {
        name: "View response",
        exact: true,
      });
      await expect(
        viewer.getByText("Error loading questionnaire response", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(viewer.getByText(answer, { exact: true })).toHaveCount(0);
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(rows).toHaveCount(0);
    });
  });

  test("filters device responses and uses the picker and overview on mobile", async ({
    page,
  }) => {
    const device = await createAndOpenDevice(page, facilityId);
    const devicePath = `/facility/${facilityId}/settings/devices/${device.id}`;
    const history = await createDeviceResponseHistory(facilityId, device.id);
    const rows = page.locator(
      '[data-cy="device-responses-page"] [data-slot="table-body"] tr',
    );
    const filters = page.locator('[data-cy="device-response-filters"]');
    await page.goto(`${devicePath}/responses`);

    await test.step("form and status filters select the expected submissions", async () => {
      await expect(rows).toHaveCount(3);
      await filters
        .getByRole("combobox", { name: "Questionnaire", exact: true })
        .click();
      const formRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/questionnaire/" &&
          url.searchParams.get("title") === history.secondForm.title
        );
      });
      await page
        .getByRole("combobox", { name: "Search Forms", exact: true })
        .fill(history.secondForm.title);
      await page
        .getByRole("option", { name: history.secondForm.title, exact: true })
        .click();
      const query = new URL((await formRequest).url()).searchParams;
      expect(query.get("subject_type")).toBe("device");
      expect(query.get("facility_or_instance")).toBe(facilityId);
      await expect(rows).toHaveCount(2);
      await expect(
        rows.filter({ hasText: history.firstForm.title }),
      ).toHaveCount(0);
      await expect(
        rows.filter({ hasText: history.secondForm.title }),
      ).toHaveCount(2);
      await filters
        .getByRole("combobox", { name: "Status", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Entered in Error", exact: true })
        .click();
      await expect(rows).toHaveCount(1);
      await expect(rows).toHaveAttribute(
        "data-response-id",
        history.errored.id,
      );
      await filters
        .getByRole("combobox", { name: "Status", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Completed", exact: true })
        .click();
      await expect(rows).toHaveCount(1);
      await expect(rows).toHaveAttribute(
        "data-response-id",
        history.completed.id,
      );
    });

    await test.step("the submitter filter and selected labels persist after reload", async () => {
      const submitter = filters.getByRole("combobox", {
        name: "Submitted by",
        exact: true,
      });
      await submitter.click();
      await page
        .getByPlaceholder("Search", { exact: true })
        .fill(history.user.username);
      const authorRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/resource_responses/" &&
          url.searchParams.get("created_by") === history.user.id
        );
      });
      await page
        .getByRole("option")
        .filter({
          has: page.getByText(history.user.username, { exact: true }),
        })
        .click();
      const query = new URL((await authorRequest).url()).searchParams;
      expect(query.get("subject_type")).toBe("device");
      expect(query.get("subject_id")).toBe(device.id);
      const submitterName = await submitter.innerText();
      await expect(rows).toHaveCount(1);
      const params = new URL(page.url()).searchParams;
      expect(params.get("questionnaire")).toBe(history.secondForm.id);
      expect(params.get("status")).toBe("completed");
      expect(params.get("created_by")).toBe(history.user.id);
      await page.reload();
      await expect(rows).toHaveAttribute(
        "data-response-id",
        history.completed.id,
      );
      await expect(
        filters.getByRole("combobox", { name: "Questionnaire", exact: true }),
      ).toContainText(history.secondForm.title);
      await expect(
        filters.getByRole("combobox", { name: "Status", exact: true }),
      ).toContainText("Completed");
      await expect(submitter).toContainText(submitterName);
    });

    await test.step("mobile displays the saved response and dismisses the picker without losing filters", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        rows.getByRole("button", { name: "View", exact: true }),
      ).toBeVisible();
      await rows.getByRole("button", { name: "View", exact: true }).click();
      const viewer = page.getByRole("dialog", {
        name: history.secondForm.title,
        exact: true,
      });
      await expect(
        viewer.getByText(history.completed.answer, { exact: true }),
      ).toBeVisible();
      await expect(
        viewer.getByText(device.name, { exact: true }),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(390);
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(viewer).not.toBeVisible();

      const filteredUrl = page.url();
      await page
        .getByRole("button", { name: "Submit forms", exact: true })
        .click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await picker
        .getByPlaceholder("Search Forms")
        .fill(DEVICE_QUESTIONNAIRE_TITLE);
      await expect(
        picker.getByRole("option", {
          name: DEVICE_QUESTIONNAIRE_TITLE,
          exact: true,
        }),
      ).toBeVisible();
      expect(page.url()).toBe(filteredUrl);
      await page.keyboard.press("Escape");
      await expect(picker).not.toBeVisible();
      expect(page.url()).toBe(filteredUrl);
      await expect(rows).toHaveAttribute(
        "data-response-id",
        history.completed.id,
      );
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(390);
    });

    await test.step("mobile tabs retain device details and opening a form still uses the fullscreen route", async () => {
      await page.getByRole("tab", { name: "Overview", exact: true }).click();
      await expect(page).toHaveURL(devicePath);
      const overview = page.locator('[data-cy="device-overview-panel"]');
      await expect(overview).toBeVisible();
      await expect(
        overview.locator('h4:has-text("Registered Name") + p'),
      ).toHaveText(device.name);
      await expect(
        page.getByRole("button", { name: "Edit", exact: true }),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(390);
      await page.getByRole("tab", { name: "Responses", exact: true }).click();
      await expect(page).toHaveURL(`${devicePath}/responses`);
      await page.reload();
      await expect(
        page.getByRole("tab", { name: "Responses", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(rows).toHaveCount(3);
      await page
        .getByRole("button", { name: "Submit forms", exact: true })
        .click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await picker
        .getByPlaceholder("Search Forms")
        .fill(DEVICE_QUESTIONNAIRE_TITLE);
      await picker
        .getByRole("option", { name: DEVICE_QUESTIONNAIRE_TITLE, exact: true })
        .click();
      await expect(page).toHaveURL(
        `${devicePath}/questionnaire/${questionnaireId}`,
      );
      await expect(questionBlock(page, "Notes")).toBeVisible();
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page).toHaveURL(`${devicePath}/responses`);
      await expect(rows).toHaveCount(3);
    });
  });

  for (const refreshTarget of ["device details", "service history"] as const) {
    test(`a failed ${refreshTarget} background refresh preserves unsaved service notes`, async ({
      page,
      context,
    }) => {
      const device = await createAndOpenDevice(page, facilityId);
      const deviceEndpoint = `/api/v1/facility/${facilityId}/device/${device.id}/`;
      const historyEndpoint = `${deviceEndpoint}service_history/`;
      const originalNote = `Saved service ${faker.string.alphanumeric(10)}`;
      const service = await historyRequest<{ id: string }>(historyEndpoint, {
        method: "POST",
        body: {
          note: originalNote,
          serviced_on: new Date().toISOString(),
        },
      });
      await page.reload();
      const row = page
        .getByRole("table", { name: "Service History", exact: true })
        .getByRole("row")
        .filter({ hasText: originalNote });
      await row
        .getByRole("button", { name: "Edit Service Record", exact: true })
        .click();
      const editor = page.getByRole("dialog", {
        name: "Edit Service Record",
        exact: true,
      });
      const notes = editor.getByRole("textbox", { name: "Notes" });
      await expect(notes).toHaveValue(originalNote);
      const unsavedNote = `Unsaved service ${faker.string.alphanumeric(10)}`;
      await notes.fill(unsavedNote);

      const failedEndpoint =
        refreshTarget === "device details" ? deviceEndpoint : historyEndpoint;
      const matchesEndpoint = (url: URL) => url.pathname === failedEndpoint;
      await page.route(matchesEndpoint, async (route) => {
        if (route.request().method() !== "GET") {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Temporary test refresh failure" }),
        });
      });

      try {
        const failedResponse = page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === failedEndpoint &&
            response.status() === 503,
        );
        // Reconnecting triggers React Query's normal stale-data refetch while
        // the user remains in the editor; no save or navigation is involved.
        await context.setOffline(true);
        await expect
          .poll(() => page.evaluate(() => navigator.onLine))
          .toBe(false);
        await context.setOffline(false);
        await failedResponse;

        await expect(
          page.getByText(
            `Unable to refresh ${refreshTarget}. Please try again.`,
            { exact: true },
          ),
        ).toBeVisible();
        await expect(editor).toBeVisible();
        await expect(notes).toHaveValue(unsavedNote);
        await editor
          .getByRole("button", { name: "Close", exact: true })
          .click();
        await expect(editor).not.toBeVisible();
        await expect(row).toBeVisible();
        await expect(
          page.getByRole("heading", { name: device.name, exact: true }),
        ).toBeVisible();
      } finally {
        await context.setOffline(false);
        await page.unroute(matchesEndpoint);
      }

      const savedHistory = await historyRequest<{
        count: number;
        results: { id: string; note: string }[];
      }>(historyEndpoint);
      expect(savedHistory.count).toBe(1);
      expect(savedHistory.results[0]).toMatchObject({
        id: service.id,
        note: originalNote,
      });
    });
  }
});
