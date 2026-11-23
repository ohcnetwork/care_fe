import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The queue list and the queue board read their query strings with typed
// search schemas (`queueListSearch` and `queueBoardSearch` in
// `src/lib/router/search/queues.ts`), under a practitioner, a location and a
// healthcare service.

/** The next queue list request whose query matches `match`. */
const queueListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      /\/api\/v1\/facility\/[^/]+\/token\/queue\/$/.test(url.pathname) &&
      match(url.searchParams)
    );
  });

/** The next token list request of a queue whose query matches `match`. */
const tokenListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      /\/token\/queue\/[^/]+\/token\/$/.test(url.pathname) &&
      match(url.searchParams)
    );
  });

const isDate = (value: string | null) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");

test.describe("Queue list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/queues${search ? `?${search}` : ""}`;
  };

  test("fills today's date into the URL", async ({ page }) => {
    await page.goto(listUrl());

    await expect(page).toHaveURL((url) => isDate(url.searchParams.get("date")));
  });

  test("restores the date and page from a bookmarked URL", async ({ page }) => {
    const listRequest = queueListRequest(
      page,
      (params) =>
        params.get("date") === "2026-01-15" && params.get("offset") === "14",
    );
    await page.goto(listUrl({ date: "2026-01-15", page: "2" }));
    await listRequest;

    await expect(page).toHaveURL(/[?&]date=2026-01-15(&|$)/);
    // A past date cannot get a new queue.
    await expect(
      page.getByRole("button", { name: /create queue/i }),
    ).toBeDisabled();
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const listRequests: URLSearchParams[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (/\/api\/v1\/facility\/[^/]+\/token\/queue\/$/.test(url.pathname))
        listRequests.push(url.searchParams);
    });

    const listRequest = queueListRequest(
      page,
      (params) => isDate(params.get("date")) && params.get("offset") === "0",
    );
    await page.goto(listUrl({ date: "bogus", page: "abc" }));
    await listRequest;

    // The page sets today's date over the invalid one.
    await expect(page).toHaveURL(
      (url) =>
        isDate(url.searchParams.get("date")) &&
        url.searchParams.get("page") !== "abc",
    );
    expect(
      listRequests.filter(
        (params) =>
          params.get("date") === "bogus" || params.get("offset") === "NaN",
      ),
    ).toHaveLength(0);
  });
});

test.describe("Queue board search params", () => {
  let facilityId: string;
  let boardPath: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const queueName = faker.lorem.words(3);

    await test.step("Create a queue for today and open its board", async () => {
      await page.goto(`/facility/${facilityId}/queues`);
      await page.getByRole("button", { name: /create queue/i }).click();
      await page.getByRole("textbox", { name: /queue name/i }).fill(queueName);
      await page.getByRole("button", { name: /create queue/i }).click();
      await expectToast(page, /queue created successfully/i);

      await page
        .getByRole("row")
        .filter({ hasText: queueName })
        .getByRole("link", { name: queueName, exact: true })
        .click();
      await expect(page).toHaveURL(
        /\/practitioner\/[^/]+\/queues\/[^/]+\/ongoing$/,
      );
      boardPath = new URL(page.url()).pathname.replace(/\/ongoing$/, "");
    });
  });

  test("writes the patient search and auto refresh to the URL", async ({
    page,
  }) => {
    await test.step("Search by patient name", async () => {
      const search = faker.string.alpha(6);
      const tokenRequest = tokenListRequest(
        page,
        (params) => params.get("patient_name") === search,
      );
      await page
        .getByPlaceholder("Search by patient name")
        .filter({ visible: true })
        .fill(search);
      await tokenRequest;

      await expect(page).toHaveURL(
        (url) => url.searchParams.get("search") === search,
      );
    });

    await test.step("Turn on auto refresh", async () => {
      await page.getByRole("switch").filter({ visible: true }).click();

      await expect(page).toHaveURL(/[?&]autoRefresh=true(&|$)/);
    });

    await test.step("The finished tab keeps auto refresh", async () => {
      await page.getByRole("tab", { name: /^finished/i }).click();

      await expect(page).toHaveURL(`${boardPath}/completed?autoRefresh=true`);
      await expect(
        page.getByRole("switch").filter({ visible: true }),
      ).toBeChecked();
    });
  });

  test("restores the patient search from a bookmarked URL", async ({
    page,
  }) => {
    const search = faker.string.alpha(6);
    const tokenRequest = tokenListRequest(
      page,
      (params) => params.get("patient_name") === search,
    );
    await page.goto(
      `${boardPath}/ongoing?${new URLSearchParams({ search, autoRefresh: "true" })}`,
    );
    await tokenRequest;

    await expect(
      page.getByPlaceholder("Search by patient name").filter({ visible: true }),
    ).toHaveValue(search);
    await expect(
      page.getByRole("switch").filter({ visible: true }),
    ).toBeChecked();
  });

  test("the queue URL opens the ongoing tab with its query", async ({
    page,
  }) => {
    const search = faker.string.alpha(6);
    await page.goto(`${boardPath}?${new URLSearchParams({ search })}`);

    await expect(page).toHaveURL(`${boardPath}/ongoing?search=${search}`);
    await expect(
      page.getByPlaceholder("Search by patient name").filter({ visible: true }),
    ).toHaveValue(search);
  });

  test("ignores an invalid auto refresh value", async ({ page }) => {
    await page.goto(`${boardPath}/ongoing?autoRefresh=bogus`);

    const autoRefresh = page.getByRole("switch").filter({ visible: true });
    await expect(autoRefresh).not.toBeChecked();

    await autoRefresh.click();

    await expect(page).toHaveURL(`${boardPath}/ongoing?autoRefresh=true`);
  });
});
