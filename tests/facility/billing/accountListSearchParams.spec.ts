import { expect, test, type Page } from "@playwright/test";
import { addDays, format, parse, startOfDay, subDays } from "date-fns";

import {
  applyCustomDateFilterRange,
  applyDateFilterPreset,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The account list reads its query string with a typed search schema
// (`accountListSearch` in `src/lib/router/search/billing.ts`). It opens with
// the active accounts (`defaultQueryParams`). The period filter keeps calendar
// days in the URL; the API gets the instants that bound those days.

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

const periodFilterBar = (page: Page) => selectedMultiFilterBar(page, /period/i);

/** The calendar day `days` days before today, as the URL holds it. */
const daysAgo = (days: number) =>
  format(subDays(new Date(), days), "yyyy-MM-dd");

const localDay = (value: string) =>
  startOfDay(parse(value, "yyyy-MM-dd", new Date()));

/**
 * The account list request for the days `after` to `before`: from the first
 * day's midnight to the midnight after the last day.
 */
const periodRequest = (page: Page, after: string, before: string) =>
  accountListRequest(
    page,
    (params) =>
      params.get("created_date_after") === localDay(after).toISOString() &&
      params.get("created_date_before") ===
        addDays(localDay(before), 1).toISOString(),
  );

/** The period chip's label for a range of two different days. */
const rangeLabel = (after: string, before: string) => {
  const from = localDay(after);
  const to = localDay(before);
  const pattern =
    from.getFullYear() !== to.getFullYear() ? "d MMM yy" : "d MMM";
  return `${format(from, pattern)} - ${format(to, pattern)}`;
};

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

  test("shows the picked period up to its last day", async ({ page }) => {
    const after = daysAgo(8);
    const before = daysAgo(6);

    await page.goto(listUrl());
    await expect(statusFilterBar(page)).toContainText(/active/i);

    const request = periodRequest(page, after, before);
    await applyCustomDateFilterRange(page, /period/i, after, before);
    await request;

    await expect(page).toHaveURL(
      new RegExp(`[?&]created_date_after=${after}(&|$)`),
    );
    await expect(page).toHaveURL(
      new RegExp(`[?&]created_date_before=${before}(&|$)`),
    );
    await expect(periodFilterBar(page)).toContainText(
      rangeLabel(after, before),
    );
  });

  test("restores the period from a bookmarked URL", async ({ page }) => {
    const after = daysAgo(8);
    const before = daysAgo(6);

    const request = periodRequest(page, after, before);
    await page.goto(
      listUrl({
        status: "active",
        created_date_after: after,
        created_date_before: before,
      }),
    );
    await request;

    await expect(periodFilterBar(page)).toContainText(
      rangeLabel(after, before),
    );
  });

  test("shows the Today preset by name", async ({ page }) => {
    const today = daysAgo(0);

    await page.goto(listUrl());
    await expect(statusFilterBar(page)).toContainText(/active/i);

    const request = periodRequest(page, today, today);
    await applyDateFilterPreset(page, /period/i, /^today$/i);
    await request;

    await expect(page).toHaveURL(
      new RegExp(`[?&]created_date_after=${today}(&|$)`),
    );
    await expect(page).toHaveURL(
      new RegExp(`[?&]created_date_before=${today}(&|$)`),
    );
    await expect(periodFilterBar(page)).toContainText(/today/i);
  });
});
