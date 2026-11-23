import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  filterSelectButton,
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { selectFromFilterSelect } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The activity definitions pages read their query string with a typed search
// schema (`activityDefinitionsPageSearch` in
// `src/lib/router/search/settings.ts`): the category search
// (`searchCategory`) and the filters of the definitions in a category.

test.describe("Activity definition search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () =>
    `/facility/${facilityId}/settings/activity_definitions`;

  /** The slug of the first root category of the activity definitions. */
  async function firstCategorySlug(page: Page) {
    const request = waitForApiList(
      page,
      "/resource_category/",
      (params) => params.get("resource_type") === "activity_definition",
    );
    await page.goto(listPath());
    const { results } = (await (await request).json()) as {
      results: { slug: string }[];
    };
    return results[0].slug;
  }

  test("writes the category search to the URL and the API request", async ({
    page,
  }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    await page.goto(listPath());
    await expect(
      page.getByRole("heading", { name: "Activity Definition" }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/resource_category/",
      (params) => params.get("title") === searchText,
    );
    await page.getByRole("textbox", { name: "Search" }).fill(searchText);
    await request;

    await expect(page).toHaveURL(queryParam("searchCategory", searchText));
  });

  test("restores the category search from a bookmarked URL", async ({
    page,
  }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    const request = waitForApiList(
      page,
      "/resource_category/",
      (params) => params.get("title") === searchText,
    );
    await page.goto(withSearch(listPath(), { searchCategory: searchText }));
    await request;

    await expect(page.getByRole("textbox", { name: "Search" })).toHaveValue(
      searchText,
    );
  });

  test("writes the status filter of a category to the URL and the API request", async ({
    page,
  }) => {
    const slug = await firstCategorySlug(page);
    await page.goto(`${listPath()}/categories/${slug}`);
    await expect(page).toHaveURL(queryParam("status", "active"));

    const request = waitForApiList(
      page,
      "/activity_definition/",
      (params) =>
        params.get("category") === slug && params.get("status") === "draft",
    );
    await selectFromFilterSelect(page, /status/i, "^draft$");
    await request;

    await expect(page).toHaveURL(queryParam("status", "draft"));
    await expect(filterSelectButton(page, /status\s*draft/i)).toBeVisible();
  });

  test("restores the filters of a category from a bookmarked URL", async ({
    page,
  }) => {
    const slug = await firstCategorySlug(page);
    const request = waitForApiList(
      page,
      "/activity_definition/",
      (params) =>
        params.get("status") === "retired" &&
        params.get("classification") === "laboratory",
    );
    await page.goto(
      withSearch(`${listPath()}/categories/${slug}`, {
        status: "retired",
        classification: "laboratory",
      }),
    );
    await request;

    await expect(filterSelectButton(page, /status\s*retired/i)).toBeVisible();
    await expect(
      filterSelectButton(page, /category\s*laboratory/i),
    ).toBeVisible();
  });

  test("uses the active status in place of invalid filters", async ({
    page,
  }) => {
    const slug = await firstCategorySlug(page);
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/activity_definition/",
      (params) =>
        params.get("status") === "active" &&
        params.get("offset") === "0" &&
        !params.has("classification"),
    );
    await page.goto(
      withSearch(`${listPath()}/categories/${slug}`, {
        status: "bogus",
        classification: "bogus",
        page: "abc",
      }),
    );
    await request;

    await expect(page).toHaveURL(queryParam("status", "active"));
    await expect(filterSelectButton(page, /status\s*active/i)).toBeVisible();
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });
});
