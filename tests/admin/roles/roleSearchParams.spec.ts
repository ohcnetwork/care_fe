import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";

test.use({ storageState: "tests/.auth/user.json" });

// The role list and the permissions page read their query strings with typed
// search schemas (`roleListSearch` and `permissionListSearch` in
// `src/lib/router/search/admin.ts`).

test.describe("Role list search params", () => {
  const listPath = "/admin/rbac/roles";

  test("writes the search to the URL and the API request", async ({ page }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    await page.goto(listPath);
    await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();

    const request = waitForApiList(
      page,
      "/role/",
      (params) => params.get("name") === searchText,
    );
    await page.getByRole("textbox", { name: "Search Roles" }).fill(searchText);
    await request;

    await expect(page).toHaveURL(queryParam("search", searchText));
  });

  test("restores the search from a bookmarked URL", async ({ page }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    const request = waitForApiList(
      page,
      "/role/",
      (params) => params.get("name") === searchText,
    );
    await page.goto(withSearch(listPath, { search: searchText }));
    await request;

    await expect(
      page.getByRole("textbox", { name: "Search Roles" }),
    ).toHaveValue(searchText);
  });
});

test.describe("Permissions page search params", () => {
  const permissionsPath = "/admin/rbac/permissions";

  test("opens the bookmarked page", async ({ page }) => {
    const request = waitForApiList(
      page,
      "/role/",
      (params) => params.get("offset") === "15",
    );
    await page.goto(withSearch(permissionsPath, { page: "2" }));
    await request;

    await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();
  });

  test("reads an invalid page number as the first page", async ({ page }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/role/",
      (params) => params.get("offset") === "0",
    );
    await page.goto(withSearch(permissionsPath, { page: "abc" }));
    await request;

    await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();
    api.expectNotSent("abc");
  });
});
