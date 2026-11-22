import { expect, test } from "@playwright/test";

import { queryParam, withSearch } from "tests/helper/searchParams";

test.use({ storageState: "tests/.auth/user.json" });

// The apps pages read their query strings with typed search schemas
// (`src/lib/router/search/admin.ts`): the tab of the app list
// (`plugConfigListSearch`) and the app store id of a new app config
// (`plugConfigEditSearch`).

test.describe("Apps search params", () => {
  test("writes the tab to the URL and opens it from a bookmarked URL", async ({
    page,
  }) => {
    await page.goto("/admin/apps");
    await expect(
      page.getByRole("tab", { name: "Installed apps" }),
    ).toHaveAttribute("aria-selected", "true");

    await page.getByRole("tab", { name: "Available apps" }).click();
    await expect(page).toHaveURL(queryParam("tab", "available"));

    await page.goto(withSearch("/admin/apps", { tab: "available" }));
    await expect(
      page.getByRole("tab", { name: "Available apps" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("opens the installed apps for an invalid tab", async ({ page }) => {
    await page.goto(withSearch("/admin/apps", { tab: "bogus" }));

    await expect(
      page.getByRole("tab", { name: "Installed apps" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("loads the app store app of the URL in a new app config", async ({
    page,
  }) => {
    const appId = "typed-search-params-app";
    // Answer the app store request here: the test checks only that the page
    // asks for the app of the URL.
    await page.route(`**/${appId}/`, (route) =>
      route.fulfill({ status: 404, body: "{}" }),
    );
    const request = page.waitForRequest((request) =>
      request.url().endsWith(`/${appId}/`),
    );
    await page.goto(withSearch("/admin/apps/new", { appId }));
    await request;
  });
});
