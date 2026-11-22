import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";

test.use({ storageState: "tests/.auth/user.json" });

// The child organizations of a government organization read their query
// string with a typed search schema (`adminOrganizationListSearch` in
// `src/lib/router/search/admin.ts`).

const searchBox = (page: Page) =>
  page.getByRole("textbox", { name: "Search by department/team name" });

test.describe("Government organization search params", () => {
  const listPath = "/admin/organizations/govt";

  test("writes the search to the URL and the API request", async ({ page }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    await page.goto(listPath);
    await expect(
      page.getByRole("heading", { name: "Governance" }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/organization/",
      (params) => params.get("name") === searchText,
    );
    await searchBox(page).fill(searchText);
    await request;

    await expect(page).toHaveURL(queryParam("search", searchText));
  });

  test("restores the search of an organization from a bookmarked URL", async ({
    page,
  }) => {
    const list = waitForApiList(
      page,
      "/organization/",
      (params) => params.get("org_type") === "govt" && params.has("offset"),
    );
    await page.goto(listPath);
    const { results } = (await (await list).json()) as {
      results: { id: string }[];
    };
    const organizationId = results[0].id;

    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/organization/",
      (params) =>
        params.get("parent") === organizationId &&
        params.get("name") === searchText &&
        params.get("offset") === "0",
    );
    await page.goto(
      withSearch(`${listPath}/${organizationId}`, {
        search: searchText,
        page: "abc",
      }),
    );
    await request;

    await expect(searchBox(page)).toHaveValue(searchText);
    api.expectNotSent("abc");
  });
});
