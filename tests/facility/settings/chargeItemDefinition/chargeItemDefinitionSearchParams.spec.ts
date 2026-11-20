import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  filterSelectButton,
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The charge item definitions pages read their query string with a typed
// search schema (`chargeItemDefinitionsPageSearch` in
// `src/lib/router/search/settings.ts`): the category search and the filters
// of the definitions in a category.

test.describe("Charge item definition search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () =>
    `/facility/${facilityId}/settings/charge_item_definitions`;

  /** The slug of the first root category of the charge item definitions. */
  async function firstCategorySlug(page: Page) {
    const request = waitForApiList(
      page,
      "/resource_category/",
      (params) => params.get("resource_type") === "charge_item_definition",
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
      page.getByRole("heading", { name: "Charge Item Definitions" }),
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

  test("restores the status filter of a category from a bookmarked URL", async ({
    page,
  }) => {
    const slug = await firstCategorySlug(page);
    const request = waitForApiList(
      page,
      "/charge_item_definition/",
      (params) =>
        params.get("category") === slug && params.get("status") === "draft",
    );
    await page.goto(
      withSearch(`${listPath()}/categories/${slug}`, { status: "draft" }),
    );
    await request;

    await expect(filterSelectButton(page, /status\s*draft/i)).toBeVisible();
    await expect(page).toHaveURL(queryParam("status", "draft"));
  });

  test("uses the active status in place of invalid filters", async ({
    page,
  }) => {
    const slug = await firstCategorySlug(page);
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/charge_item_definition/",
      (params) =>
        params.get("status") === "active" && params.get("offset") === "0",
    );
    await page.goto(
      withSearch(`${listPath()}/categories/${slug}`, {
        status: "bogus",
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
