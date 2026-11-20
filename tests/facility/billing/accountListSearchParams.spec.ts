import { expect, test, type Page } from "@playwright/test";

import { selectedMultiFilterBar } from "tests/helper/multiFilter";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The account list reads its query string with a typed search schema
// (`accountListSearch` in `src/lib/router/search/billing.ts`). It opens with
// the active accounts (`defaultQueryParams`).

/** The next account list request whose query matches `match`. */
const accountListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname.endsWith("/account/") &&
      match(url.searchParams)
    );
  });

const statusFilterBar = (page: Page) =>
  selectedMultiFilterBar(page, /account status/i);

test.describe("Account list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/billing/account${search ? `?${search}` : ""}`;
  };

  test("opens with the active status filter", async ({ page }) => {
    await page.goto(listUrl());

    await expect(page).toHaveURL(/[?&]status=active(&|$)/);
    await expect(statusFilterBar(page)).toContainText(/active/i);
  });

  test("restores the account status filter from a bookmarked URL", async ({
    page,
  }) => {
    const request = accountListRequest(
      page,
      (params) => params.get("status") === "on_hold",
    );
    await page.goto(listUrl({ status: "on_hold" }));
    await request;

    await expect(statusFilterBar(page)).toContainText(/on hold/i);
    await expect(page).toHaveURL(/[?&]status=on_hold(&|$)/);
  });

  test("uses the active status in place of an invalid one", async ({
    page,
  }) => {
    await page.goto(listUrl({ status: "bogus" }));

    await expect(page).toHaveURL(/[?&]status=active(&|$)/);
    await expect(statusFilterBar(page)).toContainText(/active/i);
    await expect(page).not.toHaveURL(/bogus/);
  });
});
