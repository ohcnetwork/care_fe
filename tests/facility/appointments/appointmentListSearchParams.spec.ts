import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { format } from "date-fns";

import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The appointments page reads its query string with a typed search schema
// (`appointmentListSearch` in `src/lib/router/search/appointments.ts`) under
// a practitioner, a location and a healthcare service. Its print page reads
// the same schema. These tests cover the URL contract: filters round-trip
// through the URL as strings, bookmarks restore them, and invalid values do
// not break the page or reach the API.

/** The statuses of the "Non Fulfilled" group, as the page writes them. */
const NON_FULFILLED = "cancelled,entered_in_error,rescheduled,noshow";

/** The next request of the list view (15 per page) that matches `match`. */
const appointmentListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      /\/api\/v1\/facility\/[^/]+\/appointments\/$/.test(url.pathname) &&
      url.searchParams.get("limit") === "15" &&
      match(url.searchParams)
    );
  });

async function currentUserId(request: APIRequestContext) {
  const response = await request.get(
    `${getApiUrl()}/api/v1/users/getcurrentuser/`,
    { headers: getApiHeaders() },
  );
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { id: string }).id;
}

// The page has one switch, next to its "Auto Refresh" label.
const autoRefreshSwitch = (page: Page) => page.getByRole("switch");

const listTab = (page: Page) =>
  page.getByRole("tab", { name: "List", exact: true });

test.describe("Appointment list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/appointments${search ? `?${search}` : ""}`;
  };

  test("fills the practitioner and today's date into the URL", async ({
    page,
    request,
  }) => {
    const userId = await currentUserId(request);
    // With the default configuration, the list opens on today. The day can
    // change while the page loads, so the day after navigation also counts.
    const dayBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(listUrl());

    await expect(page).toHaveURL((url) => {
      const today = [dayBefore, format(new Date(), "yyyy-MM-dd")];
      const dateFrom = url.searchParams.get("date_from") ?? "";
      return (
        url.searchParams.get("practitioners") === userId &&
        today.includes(dateFrom) &&
        url.searchParams.get("date_to") === dateFrom
      );
    });
  });

  test("writes the status tab of the list to the URL and the request", async ({
    page,
    request,
  }) => {
    const userId = await currentUserId(request);
    await page.goto(
      listUrl({
        practitioners: userId,
        date_from: "2026-01-01",
        date_to: "2026-01-20",
      }),
    );
    await listTab(page).click();
    await expect(
      page.getByRole("tab", { name: "Booked", exact: true }),
    ).toHaveAttribute("aria-selected", "true");

    const listRequest = appointmentListRequest(
      page,
      (params) =>
        params.get("status") === "checked_in" &&
        params.get("date_after") === "2026-01-01" &&
        params.get("date_before") === "2026-01-20" &&
        params.get("resource_ids") === userId,
    );
    await page.getByRole("tab", { name: "Checked-In", exact: true }).click();
    await listRequest;

    await expect(page).toHaveURL(/[?&]status=checked_in(&|$)/);
    // A new filter goes back to the first page.
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
    await expect(page).toHaveURL(/[?&]date_from=2026-01-01(&|$)/);
  });

  test("restores a status group and dates from a bookmarked URL", async ({
    page,
    request,
  }) => {
    const userId = await currentUserId(request);
    await page.goto(
      listUrl({
        practitioners: userId,
        date_from: "2026-01-01",
        date_to: "2026-01-20",
        status: NON_FULFILLED,
        page: "2",
      }),
    );

    // The list asks for the comma-separated statuses as they are.
    const listRequest = appointmentListRequest(
      page,
      (params) =>
        params.get("status") === NON_FULFILLED &&
        params.get("date_after") === "2026-01-01" &&
        params.get("date_before") === "2026-01-20" &&
        params.get("offset") === "15",
    );
    await listTab(page).click();
    await listRequest;

    await expect(
      page.getByRole("tab", { name: "Non Fulfilled", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("status") === NON_FULFILLED,
    );
  });

  test("ignores invalid values in a bookmarked URL", async ({
    page,
    request,
  }) => {
    const userId = await currentUserId(request);
    const listRequests: URLSearchParams[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (/\/api\/v1\/facility\/[^/]+\/appointments\/$/.test(url.pathname))
        listRequests.push(url.searchParams);
    });

    await page.goto(
      listUrl({
        practitioners: userId,
        date_from: "bogus",
        page: "abc",
        autoRefresh: "bogus",
      }),
    );
    // The router drops the invalid values when the page loads.
    await expect(page).not.toHaveURL(
      /date_from=bogus|page=abc|autoRefresh=bogus/,
    );

    await test.step("Lists the first page without the invalid date", async () => {
      const listRequest = appointmentListRequest(
        page,
        (params) => params.get("offset") === "0",
      );
      await listTab(page).click();
      await listRequest;
      await expect(
        page.getByRole("tab", { name: "Booked", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(autoRefreshSwitch(page)).not.toBeChecked();
      expect(
        listRequests.filter(
          (params) =>
            params.get("date_after") === "bogus" ||
            params.get("offset") === "NaN",
        ),
      ).toHaveLength(0);
    });

    await test.step("Drops the invalid values on the next filter change", async () => {
      await page.getByRole("tab", { name: "Fulfilled", exact: true }).click();

      await expect(page).toHaveURL(/[?&]status=fulfilled(&|$)/);
      await expect(page).toHaveURL(/[?&]page=1(&|$)/);
      await expect(page).not.toHaveURL(/date_from=bogus/);
      await expect(page).not.toHaveURL(/page=abc/);
      await expect(page).not.toHaveURL(/autoRefresh=bogus/);
    });
  });

  test("writes the auto refresh switch to the URL", async ({
    page,
    request,
  }) => {
    const userId = await currentUserId(request);
    await page.goto(
      listUrl({
        practitioners: userId,
        date_from: "2026-01-01",
        date_to: "2026-01-01",
        autoRefresh: "true",
      }),
    );
    const autoRefresh = autoRefreshSwitch(page);
    await expect(autoRefresh).toBeChecked();

    await autoRefresh.click();

    await expect(page).toHaveURL(/[?&]autoRefresh=false(&|$)/);
    await expect(autoRefresh).not.toBeChecked();

    await test.step("Keeps it off on the next filter change", async () => {
      await listTab(page).click();
      await page.getByRole("tab", { name: "Fulfilled", exact: true }).click();

      await expect(page).toHaveURL(/[?&]status=fulfilled(&|$)/);
      await expect(page).toHaveURL(/[?&]autoRefresh=false(&|$)/);
      await expect(autoRefresh).not.toBeChecked();
    });
  });

  test("opens the print page with the filters of the list", async ({
    page,
    request,
  }) => {
    const userId = await currentUserId(request);
    await page.goto(
      listUrl({
        practitioners: userId,
        date_from: "2026-01-01",
        date_to: "2026-01-20",
        status: "fulfilled",
      }),
    );
    await listTab(page).click();

    const printRequest = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === `/api/v1/facility/${facilityId}/appointments/` &&
        url.searchParams.get("status") === "fulfilled" &&
        url.searchParams.get("date_after") === "2026-01-01" &&
        url.searchParams.get("date_before") === "2026-01-20" &&
        url.searchParams.get("user") === userId &&
        url.searchParams.get("limit") !== "15"
      );
    });
    await page.getByRole("button", { name: /^print/i }).click();
    await printRequest;

    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/facility/${facilityId}/appointments/print` &&
        url.searchParams.get("status") === "fulfilled" &&
        url.searchParams.get("practitioners") === userId &&
        url.searchParams.get("date_from") === "2026-01-01" &&
        url.searchParams.get("date_to") === "2026-01-20",
    );
  });
});

test.describe("Location appointment list search params", () => {
  test("restores the status from a bookmarked URL", async ({
    page,
    request,
  }) => {
    const facilityId = getFacilityId();
    const locations = await request.get(
      `${getApiUrl()}/api/v1/facility/${facilityId}/location/?limit=1&mode=kind`,
      { headers: getApiHeaders() },
    );
    expect(locations.ok()).toBe(true);
    const [location] = (
      (await locations.json()) as {
        results: { id: string }[];
      }
    ).results;
    expect(location, "The facility needs a location").toBeDefined();

    await page.goto(
      `/facility/${facilityId}/locations/${location.id}/appointments?${new URLSearchParams(
        {
          status: "fulfilled",
          date_from: "2026-01-01",
          date_to: "2026-01-20",
        },
      )}`,
    );

    const listRequest = appointmentListRequest(
      page,
      (params) =>
        params.get("status") === "fulfilled" &&
        params.get("resource_type") === "location" &&
        params.get("resource_ids") === location.id &&
        params.get("date_after") === "2026-01-01",
    );
    await listTab(page).click();
    await listRequest;

    await expect(
      page.getByRole("tab", { name: "Fulfilled", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  });
});
