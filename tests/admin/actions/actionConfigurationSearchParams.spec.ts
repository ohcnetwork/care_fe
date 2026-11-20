import { expect, test } from "@playwright/test";

import { recordApiQueries, withSearch } from "tests/helper/searchParams";

test.use({ storageState: "tests/.auth/user.json" });

// The action configuration list reads its page number with a typed search
// schema (`actionConfigurationListSearch` in `src/lib/router/search/admin.ts`).

test.describe("Action configuration list search params", () => {
  test("reads an invalid page number as the first page", async ({ page }) => {
    const api = recordApiQueries(page);
    await page.goto(withSearch("/admin/actions", { page: "abc" }));

    await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "New action configuration" }),
    ).toBeVisible();
    api.expectNotSent("abc");
  });
});
