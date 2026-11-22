import { expect, test } from "@playwright/test";

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

// The product list reads its query string with a typed search schema
// (`productListSearch` in `src/lib/router/search/settings.ts`). It opens with
// the active products.

test.describe("Product list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () => `/facility/${facilityId}/settings/product`;

  test("writes the status filter to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listPath());
    await expect(page).toHaveURL(queryParam("status", "active"));

    const request = waitForApiList(
      page,
      "/product/",
      (params) => params.get("status") === "inactive",
    );
    await selectFromFilterSelect(page, /status/i, "^inactive$");
    await request;

    await expect(page).toHaveURL(queryParam("status", "inactive"));
  });

  test("restores the status filter from a bookmarked URL", async ({ page }) => {
    const request = waitForApiList(
      page,
      "/product/",
      (params) => params.get("status") === "inactive",
    );
    await page.goto(withSearch(listPath(), { status: "inactive" }));
    await request;

    await expect(filterSelectButton(page, /status\s*inactive/i)).toBeVisible();
  });

  test("uses the active status in place of an invalid one", async ({
    page,
  }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/product/",
      (params) =>
        params.get("status") === "active" && params.get("offset") === "0",
    );
    await page.goto(withSearch(listPath(), { status: "bogus", page: "abc" }));
    await request;

    await expect(page).toHaveURL(queryParam("status", "active"));
    await expect(filterSelectButton(page, /status\s*active/i)).toBeVisible();
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });
});
