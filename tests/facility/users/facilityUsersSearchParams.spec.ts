import { expect, test, type Page } from "@playwright/test";

import { KNOWN_USERNAMES } from "tests/helper/commonConstants";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The facility users page and the departments tab of a user read their
// query string with typed search schemas (`src/lib/router/search/facility.ts`).

/** The next GET request to `pathname` whose query matches `match`. */
const apiRequest = (
  page: Page,
  pathname: string,
  match: (params: URLSearchParams) => boolean = () => true,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === pathname &&
      match(url.searchParams)
    );
  });

test.describe("Facility users search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const usersPath = () => `/api/v1/facility/${facilityId}/users/`;
  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/users${search ? `?${search}` : ""}`;
  };

  test("writes the username search to the URL and the request", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await expect(
      page.getByRole("heading", { name: "Users Management" }),
    ).toBeVisible();

    const request = apiRequest(
      page,
      usersPath(),
      (params) => params.get("username") === "care",
    );
    await page.getByPlaceholder("Search by username").fill("care");
    await request;

    await expect(page).toHaveURL(/[?&]username=care(&|$)/);
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
  });

  test("restores the username search from a bookmarked URL", async ({
    page,
  }) => {
    const request = apiRequest(
      page,
      usersPath(),
      (params) => params.get("username") === "care",
    );
    await page.goto(listUrl({ username: "care" }));
    await request;

    await expect(page.getByPlaceholder("Search by username")).toHaveValue(
      "care",
    );
  });

  test("ignores an invalid page in a bookmarked URL", async ({ page }) => {
    const request = apiRequest(page, usersPath());
    await page.goto(listUrl({ page: "abc" }));
    const params = new URL((await request).url()).searchParams;

    expect(params.get("offset")).toBe("0");

    await page.getByPlaceholder("Search by username").fill("care");
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
    await expect(page).not.toHaveURL(/page=abc/);
  });

  test("ignores an invalid page in the departments tab of a user", async ({
    page,
  }) => {
    const request = apiRequest(
      page,
      `/api/v1/facility/${facilityId}/organizations/`,
      (params) => params.has("containing_user"),
    );
    await page.goto(
      `/facility/${facilityId}/users/${KNOWN_USERNAMES[0]}/departments?page=abc`,
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("offset")).toBe("0");
  });
});
