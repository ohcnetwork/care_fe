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

// The tag config list reads its query string with a typed search schema
// (`tagConfigListSearch` in `src/lib/router/search/admin.ts`), on the admin
// and the facility settings routes. It opens with the active tag configs.

test.describe("Tag config list search params", () => {
  const listPath = "/admin/tag_config";

  test("writes the category filter to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listPath);
    await expect(page).toHaveURL(queryParam("status", "active"));

    const request = waitForApiList(
      page,
      "/tag_config/",
      (params) => params.get("category") === "lab",
    );
    await selectFromFilterSelect(page, /category/i, "^lab$");
    await request;

    await expect(page).toHaveURL(queryParam("category", "lab"));
    await expect(page).toHaveURL(queryParam("status", "active"));
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const request = waitForApiList(
      page,
      "/tag_config/",
      (params) =>
        params.get("status") === "archived" &&
        params.get("resource") === "patient",
    );
    await page.goto(
      withSearch(listPath, { status: "archived", resource: "patient" }),
    );
    await request;

    await expect(filterSelectButton(page, /status\s*archived/i)).toBeVisible();
    await expect(filterSelectButton(page, /resource\s*patient/i)).toBeVisible();
  });

  test("uses the active status in place of invalid filters", async ({
    page,
  }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/tag_config/",
      (params) =>
        params.get("status") === "active" &&
        params.get("offset") === "0" &&
        !params.has("category") &&
        !params.has("resource"),
    );
    await page.goto(
      withSearch(listPath, {
        status: "bogus",
        category: "bogus",
        resource: "bogus",
        page: "abc",
      }),
    );
    await request;

    await expect(page).toHaveURL(queryParam("status", "active"));
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });

  test("restores the filters on the facility settings list", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const request = waitForApiList(
      page,
      "/tag_config/",
      (params) =>
        params.get("facility") === facilityId &&
        params.get("category") === "diet",
    );
    await page.goto(
      withSearch(`/facility/${facilityId}/settings/tag_config`, {
        category: "diet",
      }),
    );
    await request;

    await expect(filterSelectButton(page, /category\s*diet/i)).toBeVisible();
    await expect(page).toHaveURL(queryParam("status", "active"));
  });
});
