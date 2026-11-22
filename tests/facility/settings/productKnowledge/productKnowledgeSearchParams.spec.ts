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

// The product knowledge pages read their query string with a typed search
// schema (`productKnowledgePageSearch` in `src/lib/router/search/settings.ts`):
// the category search and the filters of the products in a category.

test.describe("Product knowledge search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () => `/facility/${facilityId}/settings/product_knowledge`;

  /** The slug of the first root category of the product knowledge. */
  async function firstCategorySlug(page: Page) {
    const request = waitForApiList(
      page,
      "/resource_category/",
      (params) => params.get("resource_type") === "product_knowledge",
    );
    await page.goto(listPath());
    const { results } = (await (await request).json()) as {
      results: { slug: string }[];
    };
    return results[0].slug;
  }

  test("writes the product type filter to the URL and the API request", async ({
    page,
  }) => {
    const slug = await firstCategorySlug(page);
    await page.goto(`${listPath()}/categories/${slug}`);
    await expect(page).toHaveURL(queryParam("status", "active"));

    const request = waitForApiList(
      page,
      "/product_knowledge/",
      (params) =>
        params.get("category") === slug &&
        params.get("product_type") === "consumable",
    );
    await selectFromFilterSelect(page, /product type/i, "^consumable$");
    await request;

    await expect(page).toHaveURL(queryParam("product_type", "consumable"));
    await expect(page).toHaveURL(queryParam("status", "active"));
  });

  test("restores the filters of a category from a bookmarked URL", async ({
    page,
  }) => {
    const slug = await firstCategorySlug(page);
    const request = waitForApiList(
      page,
      "/product_knowledge/",
      (params) =>
        params.get("category") === slug &&
        params.get("status") === "retired" &&
        params.get("product_type") === "medication",
    );
    await page.goto(
      withSearch(`${listPath()}/categories/${slug}`, {
        status: "retired",
        product_type: "medication",
      }),
    );
    await request;

    await expect(filterSelectButton(page, /status\s*retired/i)).toBeVisible();
    await expect(
      filterSelectButton(page, /product type\s*medication/i),
    ).toBeVisible();
  });

  test("uses the active status in place of invalid filters", async ({
    page,
  }) => {
    const slug = await firstCategorySlug(page);
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/product_knowledge/",
      (params) =>
        params.get("category") === slug &&
        params.get("status") === "active" &&
        params.get("offset") === "0" &&
        !params.has("product_type"),
    );
    await page.goto(
      withSearch(`${listPath()}/categories/${slug}`, {
        status: "bogus",
        product_type: "bogus",
        page: "abc",
      }),
    );
    await request;

    await expect(page).toHaveURL(queryParam("status", "active"));
    await expect(page).not.toHaveURL(/product_type=/);
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });
});
