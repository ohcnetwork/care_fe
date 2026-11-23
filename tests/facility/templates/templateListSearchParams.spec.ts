import { expect, test } from "@playwright/test";

import {
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The report template list reads its query string with a typed search schema
// (`templateListSearch` in `src/lib/router/search/settings.ts`).

test.describe("Template list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listPath = () => `/facility/${facilityId}/template`;

  test("writes the status filter to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listPath());
    await expect(
      page.getByRole("heading", { name: "Templates" }),
    ).toBeVisible();

    const request = waitForApiList(
      page,
      "/template/",
      (params) => params.get("status") === "retired",
    );
    await page
      .getByRole("combobox")
      .filter({ hasText: "All Statuses" })
      .click();
    await page.getByRole("option", { name: "Archived", exact: true }).click();
    await request;

    await expect(page).toHaveURL(queryParam("status", "retired"));
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const request = waitForApiList(
      page,
      "/template/",
      (params) =>
        params.get("status") === "draft" &&
        params.get("template_type") === "patient_summary",
    );
    await page.goto(
      withSearch(listPath(), {
        status: "draft",
        template_type: "patient_summary",
      }),
    );
    await request;

    await expect(
      page.getByRole("combobox").filter({ hasText: "Draft" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox").filter({ hasText: "Patient Summary" }),
    ).toBeVisible();
  });

  test("ignores invalid filters in a bookmarked URL", async ({ page }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/template/",
      (params) =>
        params.get("offset") === "0" &&
        !params.has("status") &&
        !params.has("template_type"),
    );
    await page.goto(
      withSearch(listPath(), {
        status: "bogus",
        template_type: "bogus",
        page: "abc",
      }),
    );
    await request;

    await expect(
      page.getByRole("combobox").filter({ hasText: "All Statuses" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox").filter({ hasText: "All Types" }),
    ).toBeVisible();
    api.expectNotSent("bogus");
    api.expectNotSent("abc");
  });
});
