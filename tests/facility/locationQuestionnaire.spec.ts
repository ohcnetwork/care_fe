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

/** Backend E2E fixture: subject_type "location", one string question. */
const LOCATION_QUESTIONNAIRE_SLUG = "e2e-subject-location";
const LOCATION_QUESTIONNAIRE_TITLE = "E2E Location Questionnaire";
/** An encounter-subject fixture — must NOT be offered on a location fill. */
const ENCOUNTER_QUESTIONNAIRE_TITLE = "Respiratory Status";

interface HistoryForm {
  id: string;
  title: string;
  questionId: string;
}

interface HistoryResponse {
  id: string;
  answer: string;
}

interface HistoryUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
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

/** Seed a history larger than one page; the test exercises reviewing it,
 *  while the test above still verifies form submission through the UI. */
async function createLocationResponseHistory(
  facilityId: string,
  locationId: string,
) {
  const suffix = faker.string.alphanumeric(10).toLowerCase();

  const createForm = async (label: string): Promise<HistoryForm> => {
    const questionId = faker.string.uuid();
    const title = `Location history ${label} ${suffix}`;
    const created = await historyRequest<{ id: string }>(
      "/api/v1/questionnaire/",
      {
        method: "POST",
        body: {
          title,
          slug: `location-history-${label.toLowerCase()}-${suffix}`,
          status: "active",
          subject_type: "location",
          auth_context: "facility",
          facility: facilityId,
          questions: [
            {
              id: questionId,
              link_id: "notes",
              text: "Notes",
              type: "string",
            },
          ],
        },
      },
    );
    return { id: created.id, title, questionId };
  };

  const submit = async (
    form: HistoryForm,
    answer: string,
  ): Promise<HistoryResponse> => {
    const response = await historyRequest<{ id: string }>(
      `/api/v1/questionnaire/${form.id}/submit_resource/`,
      {
        method: "POST",
        body: {
          resource_id: locationId,
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
  const olderResponses: HistoryResponse[] = [];
  for (let index = 0; index < 20; index++) {
    olderResponses.push(
      await submit(firstForm, `History ${suffix} entry ${index + 1}`),
    );
  }
  const completed = await submit(secondForm, `Valid inspection ${suffix}`);
  const errored = await submit(secondForm, `Incorrect inspection ${suffix}`);
  await historyRequest(`/api/v1/resource_responses/${errored.id}/`, {
    method: "PUT",
    body: { status: "entered_in_error" },
  });
  const user = await historyRequest<HistoryUser>(
    "/api/v1/users/getcurrentuser/",
  );
  return { firstForm, secondForm, olderResponses, completed, errored, user };
}

/**
 * Creates a location through the settings UI and opens its view page.
 * Returns the location's id (read back off the URL) so the spec can assert
 * what the submission was recorded against.
 */
async function createAndOpenLocation(
  page: Page,
  facilityId: string,
): Promise<{ id: string; name: string }> {
  const name = `Fill-${faker.string.alphanumeric(8)}`;
  await page.goto(`/facility/${facilityId}/settings/locations`);
  await page.getByRole("button", { name: "Add Location" }).click();
  await page.getByRole("combobox", { name: "Location Form" }).click();
  await page.getByRole("option", { name: "Ward" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("button", { name: "Create" }).click();

  await page.getByRole("textbox", { name: "Search by name" }).fill(name);
  const row = page
    .locator('[data-slot="table-body"] tr')
    .filter({ hasText: name })
    .first();
  await expect(row).toBeVisible();
  await row.click();

  await page.waitForURL(/\/settings\/locations\/[0-9a-f-]+$/);
  const id = page.url().split("/").pop() as string;
  return { id, name };
}

test.describe("Location overview and forms", () => {
  let facilityId: string;
  let questionnaireId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    // Resolve the fixture BEFORE driving any UI: a missing fixture then
    // fails with the helper's "reload backend E2E fixtures" error instead
    // of an inscrutable empty picker.
    questionnaireId = await getQuestionnaireIdBySlug(
      LOCATION_QUESTIONNAIRE_SLUG,
    );
  });

  test("opens a location form from the overview and reads its saved response", async ({
    page,
  }) => {
    const answer = `Loc-${faker.string.alphanumeric(10)}`;
    const location = await createAndOpenLocation(page, facilityId);

    const locationPath = `/facility/${facilityId}/locations/${location.id}`;

    await test.step("the location root opens the overview with working quick links", async () => {
      await page.goto(`${locationPath}/`);
      await page.waitForURL(`**${locationPath}/overview`);
      const overview = page.locator('[data-cy="location-overview-page"]');
      await expect(overview).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Overview", exact: true, level: 1 }),
      ).toBeVisible();

      const header = page.locator('[data-cy="location-page-header"]');
      const breadcrumb = header.getByRole("navigation", { name: "breadcrumb" });
      await expect(breadcrumb).toContainText(location.name);
      await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
        "Overview",
      );
      const toggle = header.getByRole("button", {
        name: "Toggle Sidebar",
        exact: true,
      });
      await expect(toggle).toBeVisible();
      const sidebarContainer = page.locator(
        '[data-side="left"][data-collapsible]',
      );
      const sidebar = page.locator('[data-sidebar="sidebar"]');
      if ((await sidebarContainer.getAttribute("data-state")) === "collapsed") {
        await toggle.click();
      }
      await expect(sidebarContainer).toHaveAttribute("data-state", "expanded");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await toggle.click();
      await expect(sidebarContainer).toHaveAttribute("data-state", "collapsed");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(
        sidebar.getByRole("link", { name: "Overview", exact: true }),
      ).toBeVisible();
      const pharmacy = sidebar.getByRole("button", {
        name: "Pharmacy",
        exact: true,
      });
      await pharmacy.click();
      const pharmacyMenu = page.getByRole("dialog", {
        name: "Pharmacy",
        exact: true,
      });
      await expect(pharmacyMenu).toBeVisible();
      await expect(
        pharmacyMenu.getByRole("link", {
          name: "Prescription Queue",
          exact: true,
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(pharmacyMenu).not.toBeVisible();
      await expect(pharmacy).toBeFocused();
      await toggle.click();
      await expect(sidebarContainer).toHaveAttribute("data-state", "expanded");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");

      for (const destination of [
        "/responses",
        "/beds",
        "/medication_requests",
        "/service_requests",
        "/inventory/summary",
      ]) {
        await expect(
          overview.locator(`a[href="${locationPath}${destination}"]`),
        ).toBeVisible();
      }

      await expect(
        sidebar.locator(`a[href="${locationPath}/overview"]`),
      ).toHaveAttribute("aria-current", "page");
      await expect(
        sidebar.locator(`a[href="${locationPath}/responses"]`),
      ).toBeVisible();
      await expect(
        sidebar.locator(`a[href="${locationPath}/forms"]`),
      ).toHaveCount(0);
      expect(
        await sidebar
          .locator(`a[href^="${locationPath}/"]`)
          .evaluateAll((links) =>
            links.slice(-2).map((link) => link.getAttribute("href")),
          ),
      ).toEqual([`${locationPath}/queues`, `${locationPath}/responses`]);

      const overviewUrl = page.url();
      const submitForms = overview.getByRole("button", {
        name: /Submit forms/,
      });
      await submitForms.click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await expect(picker.getByPlaceholder("Search Forms")).toBeVisible();
      expect(page.url()).toBe(overviewUrl);
      await page.keyboard.press("Escape");
      await expect(picker).not.toBeVisible();
      expect(page.url()).toBe(overviewUrl);
      await expect(submitForms).toBeFocused();
      await submitForms.click();
    });

    await test.step("the picker only offers location-subject questionnaires", async () => {
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      const search = picker.getByPlaceholder("Search Forms");

      const pickerRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return (
          url.pathname === "/api/v1/questionnaire/" &&
          url.searchParams.get("title") === LOCATION_QUESTIONNAIRE_TITLE
        );
      });
      await search.fill(LOCATION_QUESTIONNAIRE_TITLE);
      await expect(
        picker.getByRole("option", { name: LOCATION_QUESTIONNAIRE_TITLE }),
      ).toBeVisible();
      const queryParams = new URL((await pickerRequest).url()).searchParams;
      expect(queryParams.get("subject_type")).toBe("location");
      expect(queryParams.get("status")).toBe("active");
      expect(queryParams.get("facility_or_instance")).toBe(facilityId);

      // An empty result is meaningful after the positive location control.
      await search.fill(ENCOUNTER_QUESTIONNAIRE_TITLE);
      await expect(picker.getByRole("option")).toHaveCount(0);
      await expect(picker.getByText("No Results Found")).toBeVisible();

      await search.fill(LOCATION_QUESTIONNAIRE_TITLE);
      await picker
        .getByRole("option", { name: LOCATION_QUESTIONNAIRE_TITLE })
        .click();
      await page.waitForURL(
        `**${locationPath}/questionnaire/${questionnaireId}`,
      );
    });

    await test.step("a resource subject gets the lean shell — no patient context", async () => {
      // Fill routes opt out of the app sidebar for every subject.
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      // No patient means no clinical-history tab and no blood-group strip.
      await expect(
        page.getByRole("tab", { name: "Patient Clinical History" }),
      ).toHaveCount(0);
      await expect(page.getByText("Blood Group:")).toHaveCount(0);
    });

    await test.step("answering and submitting posts to submit_resource", async () => {
      await questionBlock(page, "Notes").getByRole("textbox").fill(answer);

      const batchRequest = page.waitForRequest(
        (request) =>
          request.url().includes("/api/v1/batch_requests/") &&
          request.method() === "POST",
      );
      await page.getByRole("button", { name: "Save Changes" }).click();

      const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
        requests: { url: string; body: { resource_id: string } }[];
      };
      expect(body.requests).toHaveLength(1);
      expect(body.requests[0].url).toContain(
        `/api/v1/questionnaire/${questionnaireId}/submit_resource/`,
      );
      expect(body.requests[0].body.resource_id).toBe(location.id);
      // Resource subjects carry no patient/encounter on the submission.
      expect(body.requests[0].body).not.toHaveProperty("patient");
      expect(body.requests[0].body).not.toHaveProperty("encounter");

      await expectToast(page, "Questionnaire submitted successfully");
      await page.waitForURL(`**${locationPath}/responses`);
    });

    await test.step("the saved response survives reload and displays the submitted answer", async () => {
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Responses", exact: true, level: 1 }),
      ).toBeVisible();
      await expect(
        page
          .locator('[data-sidebar="sidebar"]')
          .locator(`a[href="${locationPath}/responses"]`),
      ).toHaveAttribute("aria-current", "page");
      const breadcrumb = page
        .locator('[data-cy="location-page-header"]')
        .getByRole("navigation", { name: "breadcrumb" });
      await expect(breadcrumb).toContainText(location.name);
      await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
        "Responses",
      );
      const response = page.getByRole("row").filter({
        hasText: LOCATION_QUESTIONNAIRE_TITLE,
      });
      await expect(response).toHaveCount(1);
      await response.getByRole("button", { name: "View", exact: true }).click();
      const dialog = page.getByRole("dialog", {
        name: LOCATION_QUESTIONNAIRE_TITLE,
      });
      await expect(dialog.getByText("Notes", { exact: true })).toBeVisible();
      await expect(dialog.getByText(answer, { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(
        response.getByRole("button", { name: "View", exact: true }),
      ).toBeFocused();

      const desktopViewport = page.viewportSize();
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        response.getByText(LOCATION_QUESTIONNAIRE_TITLE, { exact: true }),
      ).toBeVisible();
      await expect(
        response.getByRole("button", { name: "View", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(390);
      await response.getByRole("button", { name: "View", exact: true }).click();
      await expect(dialog.getByText(answer, { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      if (desktopViewport) await page.setViewportSize(desktopViewport);
    });

    await test.step("another location does not show this location's response", async () => {
      const otherLocation = await createAndOpenLocation(page, facilityId);
      await page.goto(
        `/facility/${facilityId}/locations/${otherLocation.id}/responses`,
      );
      await expect(
        page.getByText("No responses found", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("row").filter({ hasText: LOCATION_QUESTIONNAIRE_TITLE }),
      ).toHaveCount(0);
    });
  });

  test("an unanswered location fill never reaches the network", async ({
    page,
  }) => {
    const location = await createAndOpenLocation(page, facilityId);
    await test.step("forms are opened from the location workspace", async () => {
      await expect(
        page.getByRole("heading", { name: location.name, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Fill questionnaire", exact: true }),
      ).toHaveCount(0);
      await page.goto(
        `/facility/${facilityId}/locations/${location.id}/overview`,
      );
      await page
        .locator('[data-cy="location-overview-page"]')
        .getByRole("button", { name: /Submit forms/ })
        .click();
      const picker = page.getByRole("dialog", { name: "Forms", exact: true });
      await picker
        .getByPlaceholder("Search Forms")
        .fill(LOCATION_QUESTIONNAIRE_TITLE);
      await picker
        .getByRole("option", { name: LOCATION_QUESTIONNAIRE_TITLE })
        .click();
      await page.waitForURL(
        `**/facility/${facilityId}/locations/${location.id}/questionnaire/${questionnaireId}`,
      );
    });
    await expect(questionBlock(page, "Notes")).toBeVisible();

    // Counted from before the click, so nothing can slip past unobserved.
    let batchCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/batch_requests/")) batchCalls += 1;
    });
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, /Nothing to submit yet/);

    // A negative assertion read at toast time proves nothing — let the page
    // go quiet first, so a late request would still be counted.
    await page.waitForLoadState("networkidle");
    expect(batchCalls).toBe(0);
    expect(page.url()).toContain(`/questionnaire/${questionnaireId}`);

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.waitForURL(
      `**/facility/${facilityId}/locations/${location.id}/responses`,
    );
  });

  test("mobile form picker supports dismissal and back navigation", async ({
    page,
  }) => {
    // Preview rebuilds can show a persistent update notice over the mobile
    // header. Dismiss it through its control before continuing navigation.
    const updateNotice = page.locator("li[data-sonner-toast]").filter({
      hasText: "Software Update",
    });
    await page.addLocatorHandler(updateNotice, async (notice) => {
      await notice
        .getByRole("button", { name: "Close toast", exact: true })
        .click();
    });
    const location = await createAndOpenLocation(page, facilityId);
    const locationPath = `/facility/${facilityId}/locations/${location.id}`;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${locationPath}/`);
    await page.waitForURL(`**${locationPath}/overview`);

    const overview = page.locator('[data-cy="location-overview-page"]');
    await expect(overview).toBeVisible();
    const header = page.locator('[data-cy="location-page-header"]');
    const toggle = header.getByRole("button", {
      name: "Toggle Sidebar",
      exact: true,
    });
    await expect(toggle).toBeVisible();
    await toggle.click();
    const mobileNavigation = page.locator(
      '[data-sidebar="sidebar"][data-mobile="true"]',
    );
    await expect(mobileNavigation).toBeVisible();
    await expect(
      mobileNavigation.getByRole("link", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await mobileNavigation
      .getByRole("link", { name: "Responses", exact: true })
      .click();
    await page.waitForURL(`**${locationPath}/responses`);
    await expect(mobileNavigation).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(
      header
        .getByRole("navigation", { name: "breadcrumb" })
        .locator('[aria-current="page"]'),
    ).toHaveText("Responses");
    await toggle.click();
    await expect(
      mobileNavigation.getByRole("link", { name: "Responses", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await mobileNavigation
      .getByRole("link", { name: "Responses", exact: true })
      .click();
    await expect(mobileNavigation).not.toBeVisible();
    await expect(
      page
        .locator('[data-cy="location-responses-page"]')
        .getByText(location.name, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("No responses found", { exact: true }),
    ).toBeVisible();

    const responsesUrl = page.url();
    const emptyStatePicker = page
      .locator('[data-cy="location-responses-page"]')
      .getByRole("button", { name: "Submit forms", exact: true });
    await emptyStatePicker.click();
    const picker = page.getByRole("dialog", { name: "Forms", exact: true });
    await expect(picker.getByPlaceholder("Search Forms")).toBeVisible();
    expect(page.url()).toBe(responsesUrl);
    await picker
      .getByPlaceholder("Search Forms")
      .fill(LOCATION_QUESTIONNAIRE_TITLE);
    await expect(
      picker.getByRole("option", { name: LOCATION_QUESTIONNAIRE_TITLE }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(picker).not.toBeVisible();
    expect(page.url()).toBe(responsesUrl);

    await page
      .getByRole("button", { name: "Submit forms", exact: true })
      .first()
      .click();
    await expect(picker.getByPlaceholder("Search Forms")).toHaveValue("");
    await picker
      .getByPlaceholder("Search Forms")
      .fill(LOCATION_QUESTIONNAIRE_TITLE);
    await picker
      .getByRole("option", { name: LOCATION_QUESTIONNAIRE_TITLE })
      .click();
    await page.waitForURL(`**${locationPath}/questionnaire/${questionnaireId}`);
    await expect(questionBlock(page, "Notes")).toBeVisible();
    await page.goBack();
    await page.waitForURL(`**${locationPath}/responses`);
    await expect(picker).not.toBeVisible();

    await page.goto(`${locationPath}/forms`);
    await page.waitForURL(`**${locationPath}/responses`);
    await expect(
      page.getByRole("heading", { name: "Responses", exact: true }),
    ).toBeVisible();

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
  });

  test("filters a paginated response history and opens persistent response links", async ({
    page,
  }) => {
    const location = await createAndOpenLocation(page, facilityId);
    const history = await createLocationResponseHistory(
      facilityId,
      location.id,
    );
    const responsesPath = `/facility/${facilityId}/locations/${location.id}/responses`;
    const responsePage = page.locator('[data-cy="location-responses-page"]');
    const rows = responsePage.locator('[data-slot="table-body"] tr');
    const filters = page.locator('[data-cy="location-response-filters"]');

    await test.step("a form filter resets page two and returns only its two submissions", async () => {
      await page.goto(responsesPath);
      await expect(rows).toHaveCount(20);
      await page.locator("#page-2").click();
      await expect(rows).toHaveCount(2);
      await expect(
        rows.filter({ hasText: history.firstForm.title }),
      ).toHaveCount(2);

      await filters
        .getByRole("combobox", { name: "Questionnaire", exact: true })
        .click();
      await page
        .getByRole("combobox", { name: "Search Forms" })
        .fill(history.secondForm.title);
      await page
        .getByRole("option", { name: history.secondForm.title, exact: true })
        .click();
      await expect(rows).toHaveCount(2);
      await expect(
        rows.filter({ hasText: history.secondForm.title }),
      ).toHaveCount(2);
      await expect(
        rows.filter({ hasText: history.firstForm.title }),
      ).toHaveCount(0);
      expect(new URL(page.url()).searchParams.get("questionnaire")).toBe(
        history.secondForm.id,
      );
      expect(new URL(page.url()).searchParams.get("page")).not.toBe("2");
      await expect(page.locator("#page-2")).toHaveCount(0);
    });

    await test.step("the viewer moves through filtered results and preserves its link on reload", async () => {
      await rows
        .filter({ hasText: "Entered in Error" })
        .getByRole("button", { name: "View", exact: true })
        .click();
      const viewer = page.getByRole("dialog", {
        name: history.secondForm.title,
      });
      await expect(
        viewer.getByText(history.errored.answer, { exact: true }),
      ).toBeVisible();
      await expect(
        viewer.getByRole("button", { name: "Previous response", exact: true }),
      ).toBeDisabled();
      await viewer
        .getByRole("button", { name: "Next response", exact: true })
        .click();
      await expect(
        viewer.getByText(history.completed.answer, { exact: true }),
      ).toBeVisible();
      await expect(
        viewer.getByRole("button", { name: "Next response", exact: true }),
      ).toBeDisabled();
      await expect(
        viewer.getByRole("button", { name: "Previous response", exact: true }),
      ).toBeFocused();
      await viewer
        .getByRole("button", { name: "Previous response", exact: true })
        .click();
      await expect(
        viewer.getByText(history.errored.answer, { exact: true }),
      ).toBeVisible();
      await expect(
        viewer.getByRole("button", { name: "Next response", exact: true }),
      ).toBeFocused();
      expect(new URL(page.url()).searchParams.get("response")).toBe(
        history.errored.id,
      );

      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"]);
      await viewer
        .getByRole("button", { name: "Copy link", exact: true })
        .click();
      const copiedUrl = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(new URL(copiedUrl).searchParams.get("response")).toBe(
        history.errored.id,
      );
      expect(new URL(copiedUrl).searchParams.get("questionnaire")).toBe(
        history.secondForm.id,
      );
      await page.goto(copiedUrl);
      await expect(
        viewer.getByText(history.errored.answer, { exact: true }),
      ).toBeVisible();
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(viewer).not.toBeVisible();
      expect(new URL(page.url()).searchParams.has("response")).toBe(false);
      await expect(rows).toHaveCount(2);
    });

    await test.step("status and submitter filters persist with their labels after reload", async () => {
      await filters
        .getByRole("combobox", { name: "Status", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Entered in Error", exact: true })
        .click();
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText("Entered in Error");

      await filters
        .getByRole("combobox", { name: "Status", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Completed", exact: true })
        .click();
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText("Completed");

      const submitter = filters.getByRole("combobox", {
        name: "Submitted by",
        exact: true,
      });
      await submitter.click();
      await page
        .getByPlaceholder("Search", { exact: true })
        .fill(history.user.username);
      await page
        .getByRole("option")
        .filter({ has: page.getByText(history.user.username, { exact: true }) })
        .click();
      await expect(rows).toHaveCount(1);
      const submitterName = await submitter.innerText();
      const url = new URL(page.url());
      expect(url.searchParams.get("created_by")).toBe(history.user.id);
      expect(url.searchParams.get("status")).toBe("completed");
      await page.reload();
      await expect(rows).toHaveCount(1);
      await expect(
        filters.getByRole("combobox", { name: "Questionnaire", exact: true }),
      ).toContainText(history.secondForm.title);
      await expect(
        filters.getByRole("combobox", { name: "Status", exact: true }),
      ).toContainText("Completed");
      await expect(submitter).toContainText(submitterName);
      await expect(rows).toContainText(history.secondForm.title);

      await submitter.click();
      await page
        .getByPlaceholder("Search", { exact: true })
        .fill(history.user.username);
      const selectedSubmitter = page.getByRole("option").filter({
        has: page.getByText(history.user.username, { exact: true }),
      });
      await expect(selectedSubmitter.locator("svg.lucide-check")).toBeVisible();
      await page.keyboard.press("Escape");

      const filteredUrl = page.url();
      await page
        .getByRole("button", { name: "Submit forms", exact: true })
        .click();
      const formPicker = page.getByRole("dialog", {
        name: "Forms",
        exact: true,
      });
      await formPicker
        .getByPlaceholder("Search Forms")
        .fill(history.firstForm.title);
      await expect(
        formPicker.getByRole("option", {
          name: history.firstForm.title,
          exact: true,
        }),
      ).toBeVisible();
      expect(page.url()).toBe(filteredUrl);
      await page.keyboard.press("Escape");
      await expect(formPicker).not.toBeVisible();
      expect(page.url()).toBe(filteredUrl);
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText(history.secondForm.title);

      await filters
        .getByRole("button", { name: "Clear filters", exact: true })
        .click();
      await expect(rows).toHaveCount(20);
      for (const key of [
        "questionnaire",
        "questionnaire_title",
        "created_by",
        "creator_name",
        "status",
      ]) {
        expect(new URL(page.url()).searchParams.has(key)).toBe(false);
      }
    });

    await test.step("an off-page response opens directly and remains readable on mobile", async () => {
      const oldest = history.olderResponses[0];
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${responsesPath}?response=${oldest.id}`);
      const viewer = page.getByRole("dialog", {
        name: history.firstForm.title,
      });
      await expect(
        viewer.getByText(oldest.answer, { exact: true }),
      ).toBeVisible();
      await expect(
        viewer.getByText(location.name, { exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(390);
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(viewer).not.toBeVisible();
      await expect(rows).toHaveCount(20);
      await expect(
        rows.first().getByRole("button", { name: "View", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(390);

      await filters
        .getByRole("combobox", { name: "Submitted by", exact: true })
        .click();
      const submitterDrawer = page.getByRole("dialog", {
        name: "Submitted by",
        exact: true,
      });
      await expect(submitterDrawer).toBeVisible();
      await submitterDrawer
        .getByPlaceholder("Search", { exact: true })
        .fill(history.user.username);
      await submitterDrawer
        .getByRole("option")
        .filter({ has: page.getByText(history.user.username, { exact: true }) })
        .click();
      await expect(submitterDrawer).not.toBeVisible();
      expect(new URL(page.url()).searchParams.get("created_by")).toBe(
        history.user.id,
      );
      await expect(rows).toHaveCount(20);
    });
  });
});
