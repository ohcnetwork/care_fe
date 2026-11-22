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

// The immunization policy list reads its query string with a typed search
// schema (`immunizationPolicyListSearch` in `src/lib/router/search/admin.ts`),
// on the admin and the facility settings routes.

const searchBox = (page: Page) =>
  page.getByRole("textbox", { name: "Search policies by name" });

test.describe("Immunization policy list search params", () => {
  const listPath = "/admin/immunization-policies";

  test("writes the search to the URL and the API request", async ({ page }) => {
    const name = faker.string.alpha({ length: 8, casing: "lower" });
    await page.goto(listPath);
    await expect(
      page.getByRole("heading", { name: "Immunization policies" }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/immunization/policy/",
      (params) => params.get("name") === name,
    );
    await searchBox(page).fill(name);
    await request;

    await expect(page).toHaveURL(queryParam("name", name));
  });

  test("restores the search from a bookmarked URL", async ({ page }) => {
    const name = faker.string.alpha({ length: 8, casing: "lower" });
    const request = waitForApiList(
      page,
      "/immunization/policy/",
      (params) => params.get("name") === name,
    );
    await page.goto(withSearch(listPath, { name }));
    await request;

    await expect(searchBox(page)).toHaveValue(name);
  });

  test("restores the search on the facility settings list", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const name = faker.string.alpha({ length: 8, casing: "lower" });
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/immunization/policy/",
      (params) =>
        params.get("facility") === facilityId &&
        params.get("name") === name &&
        params.get("offset") === "0",
    );
    await page.goto(
      withSearch(`/facility/${facilityId}/settings/immunization-policies`, {
        name,
        page: "abc",
      }),
    );
    await request;

    await expect(searchBox(page)).toHaveValue(name);
    api.expectNotSent("abc");
  });
});
