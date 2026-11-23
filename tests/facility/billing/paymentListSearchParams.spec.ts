import { expect, test, type Page } from "@playwright/test";

import {
  applyOptionFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The payments page reads its query string with a typed search schema
// (`paymentsPageSearch` in `src/lib/router/search/billing.ts`).

/** The next payment list request whose query matches `match`. */
const paymentListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname.endsWith("/payment_reconciliation/") &&
      match(url.searchParams)
    );
  });

const statusFilterBar = (page: Page) =>
  selectedMultiFilterBar(page, /payment status/i);

test.describe("Payment list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/billing/payments${search ? `?${search}` : ""}`;
  };

  test("writes the payment status filter to the URL", async ({ page }) => {
    await page.goto(listUrl());
    await expect(page).toHaveURL(/[?&]ordering=-payment_datetime(&|$)/);

    const request = paymentListRequest(
      page,
      (params) => params.get("status") === "cancelled",
    );
    await applyOptionFilter(page, /payment status/i, /^cancelled$/i);
    await request;

    await expect(page).toHaveURL(/[?&]status=cancelled(&|$)/);
    await expect(statusFilterBar(page)).toContainText(/cancelled/i);
  });

  test("restores the payment status filter from a bookmarked URL", async ({
    page,
  }) => {
    const request = paymentListRequest(
      page,
      (params) => params.get("status") === "cancelled",
    );
    await page.goto(listUrl({ status: "cancelled" }));
    await request;

    await expect(statusFilterBar(page)).toContainText(/cancelled/i);
    await expect(page).toHaveURL(/[?&]status=cancelled(&|$)/);
  });

  test("ignores invalid filters in a bookmarked URL", async ({ page }) => {
    // The list sorts by payment date when it opens.
    const request = paymentListRequest(
      page,
      (params) => params.get("ordering") === "-payment_datetime",
    );
    await page.goto(listUrl({ status: "bogus", method: "bogus", page: "abc" }));
    const params = new URL((await request).url()).searchParams;

    expect(params.get("status")).toBeNull();
    expect(params.get("method")).toBeNull();
    expect(params.get("offset")).toBe("0");
    await expect(statusFilterBar(page)).toBeHidden();
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
    await expect(page).not.toHaveURL(/bogus|page=abc/);
  });

  test("lists the payments of the account in accountId", async ({ page }) => {
    const accountId = getAccountId();
    const request = paymentListRequest(
      page,
      (params) => params.get("account") === accountId,
    );

    await page.goto(listUrl({ accountId }));
    await request;

    await expect(page).toHaveURL(new RegExp(`[?&]accountId=${accountId}(&|$)`));
  });
});
