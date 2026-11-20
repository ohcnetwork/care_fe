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

// The specimen definition list reads its query string with a typed search
// schema (`specimenDefinitionListSearch` in
// `src/lib/router/search/settings.ts`). It opens with the active definitions.

test.describe("Specimen definition list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () =>
    `/facility/${facilityId}/settings/specimen_definitions`;

  test("writes the status filter to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listPath());
    await expect(page).toHaveURL(queryParam("status", "active"));

    const request = waitForApiList(
      page,
      "/specimen_definition/",
      (params) => params.get("status") === "retired",
    );
    await selectFromFilterSelect(page, /status/i, "^retired$");
    await request;

    await expect(page).toHaveURL(queryParam("status", "retired"));
  });

  test("restores the status filter from a bookmarked URL", async ({ page }) => {
    const request = waitForApiList(
      page,
      "/specimen_definition/",
      (params) => params.get("status") === "draft",
    );
    await page.goto(withSearch(listPath(), { status: "draft" }));
    await request;

    await expect(filterSelectButton(page, /status\s*draft/i)).toBeVisible();
  });

  test("uses the active status in place of an invalid one", async ({
    page,
  }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/specimen_definition/",
      (params) =>
        params.get("status") === "active" && params.get("offset") === "0",
    );
    await page.goto(withSearch(listPath(), { status: "bogus", page: "abc" }));
    await request;

    await expect(page).toHaveURL(queryParam("status", "active"));
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });
});
