import { expect, test, type Page } from "@playwright/test";

import {
  applyOptionFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The invoice list reads its query string with a typed search schema
// (`src/lib/router/search/billing.ts`). These tests cover the URL contract:
// filters round-trip through the URL as strings, bookmarks restore them, and
// invalid values do not break the page.

const invoiceRows = (page: Page) =>
  page.locator('[data-slot="table-body"] [data-slot="table-row"]');

const statusFilterBar = (page: Page) =>
  selectedMultiFilterBar(page, /invoice status/i);

async function waitForInvoiceRows(page: Page) {
  await expect(invoiceRows(page).first()).toBeVisible();
}

const applyInvoiceStatusFilter = (page: Page, status: RegExp) =>
  applyOptionFilter(page, /invoice status/i, status);

/** Every listed invoice has `status`; its badge is the first in the row. */
async function expectAllRowsWithStatus(page: Page, status: string) {
  await waitForInvoiceRows(page);
  const count = await invoiceRows(page).count();
  for (let i = 0; i < count; i += 1) {
    await expect(
      invoiceRows(page).nth(i).locator('[data-slot="badge"]').first(),
    ).toHaveText(status);
  }
}

/** The invoice list shows 14 invoices per page. */
const PAGE_SIZE = 14;

/** The next invoice list request whose query matches `match`. */
const invoiceListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      /\/api\/v1\/facility\/[^/]+\/invoice\/$/.test(url.pathname) &&
      match(url.searchParams)
    );
  });

test.describe("Invoice List search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/billing/invoices${search ? `?${search}` : ""}`;
  };

  test("writes the status filter to the URL and lists only that status", async ({
    page,
  }) => {
    // The second page can be empty: it depends on the number of invoices.
    const secondPage = invoiceListRequest(
      page,
      (params) => params.get("offset") === String(PAGE_SIZE),
    );
    await page.goto(listUrl({ page: "2" }));
    await secondPage;

    await applyInvoiceStatusFilter(page, /^issued$/i);

    await expect(page).toHaveURL(/[?&]status=issued(&|$)/);
    // A new filter goes back to the first page.
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
    await expect(statusFilterBar(page)).toContainText(/issued/i);
    await expectAllRowsWithStatus(page, "Issued");
  });

  test("restores the status filter from a bookmarked URL", async ({ page }) => {
    await page.goto(listUrl({ status: "issued" }));

    await expect(statusFilterBar(page)).toContainText(/issued/i);
    await expectAllRowsWithStatus(page, "Issued");
    await expect(page).toHaveURL(/[?&]status=issued(&|$)/);
  });

  test("opens the bookmarked page number", async ({ page }) => {
    const secondPage = invoiceListRequest(
      page,
      (params) => params.get("offset") === String(PAGE_SIZE),
    );
    await page.goto(listUrl({ page: "2" }));
    await secondPage;

    await expect(page).toHaveURL(/[?&]page=2(&|$)/);
  });

  test("keeps the status filter as is when the user searches", async ({
    page,
  }) => {
    await page.goto(listUrl({ status: "issued" }));
    await waitForInvoiceRows(page);

    await page.getByRole("textbox", { name: /search invoices/i }).fill("1");

    await expect(page).toHaveURL(/[?&]search=1(&|$)/);
    await expect(page).toHaveURL(/[?&]status=issued(&|$)/);
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const firstPage = invoiceListRequest(
      page,
      (params) => params.get("offset") === "0" && !params.has("status"),
    );
    await page.goto(listUrl({ page: "abc", status: "bogus" }));

    await test.step("Lists invoices from the first page, unfiltered", async () => {
      await firstPage;
      // The router drops the invalid values when the page loads.
      await expect(page).not.toHaveURL(/status=|page=abc/);
      await waitForInvoiceRows(page);
      await expect(statusFilterBar(page)).toBeHidden();
    });

    await test.step("Keeps them out on the next filter change", async () => {
      await page.getByRole("textbox", { name: /search invoices/i }).fill("1");

      await expect(page).toHaveURL(/[?&]search=1(&|$)/);
      await expect(page).toHaveURL(/[?&]page=1(&|$)/);
      await expect(page).not.toHaveURL(/status=/);
      await expect(page).not.toHaveURL(/page=abc/);
    });
  });

  test("does not restore filters after the user leaves the list", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await waitForInvoiceRows(page);
    await applyInvoiceStatusFilter(page, /^issued$/i);
    await expect(page).toHaveURL(/[?&]status=issued(&|$)/);

    await page.goto(`/facility/${facilityId}/overview`);
    await expect(page).toHaveURL(/\/overview$/);

    await page.goto(listUrl());
    await waitForInvoiceRows(page);

    await expect(statusFilterBar(page)).toBeHidden();
    await expect(page).not.toHaveURL(/status=/);
  });
});

test.describe("Account page search params", () => {
  let facilityId: string;
  let accountId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    accountId = getAccountId();
  });

  const accountTabUrl = (tab: string, params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/billing/account/${accountId}/${tab}${search ? `?${search}` : ""}`;
  };

  test("writes the invoice status filter to the account URL", async ({
    page,
  }) => {
    await page.goto(accountTabUrl("invoices"));
    await expect(
      page.getByRole("tab", { name: "Invoices", exact: true }),
    ).toHaveAttribute("aria-selected", "true");

    await applyInvoiceStatusFilter(page, /^draft$/i);

    await expect(page).toHaveURL(
      new RegExp(`/account/${accountId}/invoices\\?.*status=draft`),
    );
    await expect(statusFilterBar(page)).toContainText(/draft/i);
  });

  test("keeps a charge item status when the user searches charge items", async ({
    page,
  }) => {
    // Charge item statuses are not invoice statuses. The account route reads
    // `status` as a string, so a charge items filter must survive.
    await page.goto(accountTabUrl("charge_items", { status: "billable" }));
    await expect(
      page.getByRole("tab", { name: "Charge Items", exact: true }),
    ).toHaveAttribute("aria-selected", "true");

    await page.getByRole("textbox", { name: "Search by item" }).fill("zz");

    await expect(page).toHaveURL(/[?&]title=zz(&|$)/);
    await expect(page).toHaveURL(/[?&]status=billable(&|$)/);
  });
});
