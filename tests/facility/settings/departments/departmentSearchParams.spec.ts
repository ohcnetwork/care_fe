import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The departments pages read their query string with a typed search schema
// (`facilityOrganizationListSearch` in `src/lib/router/search/settings.ts`):
// the search and page of the sub-departments or of the users of a department.

test.describe("Department search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const departmentsPath = () => `/facility/${facilityId}/settings/departments`;

  test("writes the department search to the URL and the API request", async ({
    page,
  }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    await page.goto(departmentsPath());
    await expect(
      page.getByRole("heading", { name: "Departments/Teams" }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/organizations/",
      (params) => params.get("name") === searchText,
    );
    await page
      .getByRole("textbox", { name: "Search by department/team name" })
      .fill(searchText);
    await request;

    await expect(page).toHaveURL(queryParam("search", searchText));
  });

  test("restores the user search of a department from a bookmarked URL", async ({
    page,
  }) => {
    const list = waitForApiList(
      page,
      "/organizations/",
      (params) => params.get("offset") === "0",
    );
    await page.goto(departmentsPath());
    const { results } = (await (await list).json()) as {
      results: { id: string }[];
    };
    const departmentId = results[0].id;

    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    const request = waitForApiList(
      page,
      `/organizations/${departmentId}/users/`,
      (params) => params.get("search_text") === searchText,
    );
    await page.goto(
      withSearch(`${departmentsPath()}/${departmentId}/users`, {
        search: searchText,
      }),
    );
    await request;

    await expect(
      page.getByRole("textbox", { name: "Search by username" }),
    ).toHaveValue(searchText);
  });

  test("reads an invalid page number as the first page", async ({ page }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/organizations/",
      (params) => params.get("offset") === "0",
    );
    await page.goto(withSearch(departmentsPath(), { page: "abc" }));
    await request;

    await expect(
      page.getByRole("heading", { name: "Departments/Teams" }),
    ).toBeVisible();
    api.expectNotSent("abc");
  });
});
