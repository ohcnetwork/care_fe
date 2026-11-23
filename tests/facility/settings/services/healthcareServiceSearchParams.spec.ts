import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The healthcare service list reads its query string with a typed search
// schema (`healthcareServiceListSearch` in `src/lib/router/search/settings.ts`).

test.describe("Healthcare service list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () => `/facility/${facilityId}/settings/healthcare_services`;
  const searchBox = (page: Page) =>
    page.getByRole("textbox", { name: "Search healthcare services..." });

  test("writes the search to the URL and the API request", async ({ page }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    await page.goto(listPath());
    await expect(
      page.getByRole("heading", { name: "Healthcare Services" }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/healthcare_service/",
      (params) => params.get("name") === searchText,
    );
    await searchBox(page).fill(searchText);
    await request;

    await expect(page).toHaveURL(queryParam("search", searchText));
  });

  test("restores the search from a bookmarked URL", async ({ page }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    const request = waitForApiList(
      page,
      "/healthcare_service/",
      (params) => params.get("name") === searchText,
    );
    await page.goto(withSearch(listPath(), { search: searchText }));
    await request;

    await expect(searchBox(page)).toHaveValue(searchText);
  });

  test("reads an invalid page number as the first page", async ({ page }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/healthcare_service/",
      (params) => params.get("offset") === "0",
    );
    await page.goto(withSearch(listPath(), { page: "abc" }));
    await request;

    await expect(
      page.getByRole("heading", { name: "Healthcare Services" }),
    ).toBeVisible();
    api.expectNotSent("abc");
  });
});
