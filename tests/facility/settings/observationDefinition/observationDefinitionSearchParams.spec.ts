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

// The observation definition list reads its query string with a typed search
// schema (`observationDefinitionListSearch` in
// `src/lib/router/search/settings.ts`). It opens with the active definitions.

test.describe("Observation definition list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () =>
    `/facility/${facilityId}/settings/observation_definitions`;

  test("writes the category filter to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listPath());
    await expect(page).toHaveURL(queryParam("status", "active"));

    const request = waitForApiList(
      page,
      "/observation_definition/",
      (params) => params.get("category") === "vital_signs",
    );
    await selectFromFilterSelect(page, /category/i, "^vital signs$");
    await request;

    await expect(page).toHaveURL(queryParam("category", "vital_signs"));
    await expect(page).toHaveURL(queryParam("status", "active"));
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const request = waitForApiList(
      page,
      "/observation_definition/",
      (params) =>
        params.get("status") === "draft" &&
        params.get("category") === "laboratory",
    );
    await page.goto(
      withSearch(listPath(), { status: "draft", category: "laboratory" }),
    );
    await request;

    await expect(filterSelectButton(page, /status\s*draft/i)).toBeVisible();
    await expect(
      filterSelectButton(page, /category\s*laboratory/i),
    ).toBeVisible();
  });

  test("uses the active status in place of invalid filters", async ({
    page,
  }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/observation_definition/",
      (params) =>
        params.get("status") === "active" &&
        params.get("offset") === "0" &&
        !params.has("category"),
    );
    await page.goto(
      withSearch(listPath(), {
        status: "bogus",
        category: "bogus",
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
