import { expect, test, type Page } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The responses of a facility read their query string with a typed search
// schema (`resourceResponseListSearch` in
// `src/lib/router/search/questionnaire.ts`).

test.describe("Facility responses search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const responsesUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/settings/responses${search ? `?${search}` : ""}`;
  };

  /** The next response list request of the facility. */
  const responseListRequest = (
    page: Page,
    match: (params: URLSearchParams) => boolean,
  ) =>
    page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        request.method() === "GET" &&
        url.pathname === "/api/v1/resource_responses/" &&
        url.searchParams.get("subject_id") === facilityId &&
        match(url.searchParams)
      );
    });

  const statusFilter = (page: Page) =>
    page.getByRole("combobox", { name: "Status", exact: true });

  test("writes the status filter to the URL and the list request", async ({
    page,
  }) => {
    await page.goto(responsesUrl());
    await expect(statusFilter(page)).toContainText("All Statuses");

    const request = responseListRequest(
      page,
      (params) => params.get("status") === "entered_in_error",
    );
    await statusFilter(page).click();
    await page
      .getByRole("option", { name: "Entered in Error", exact: true })
      .click();
    await request;

    await expect(page).toHaveURL(/[?&]status=entered_in_error(&|$)/);
  });

  test("restores the status filter from a bookmarked URL", async ({ page }) => {
    const request = responseListRequest(
      page,
      (params) => params.get("status") === "completed",
    );
    await page.goto(responsesUrl({ status: "completed" }));
    await request;

    await expect(statusFilter(page)).toContainText("Completed");
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const request = responseListRequest(page, () => true);
    await page.goto(responsesUrl({ status: "bogus", page: "abc" }));
    const params = new URL((await request).url()).searchParams;
    // The router drops the invalid values when the page loads.
    await expect(page).not.toHaveURL(/status=bogus|page=abc/);

    expect(params.get("status")).toBeNull();
    expect(params.get("offset")).toBe("0");
    await expect(statusFilter(page)).toContainText("All Statuses");
  });
});
